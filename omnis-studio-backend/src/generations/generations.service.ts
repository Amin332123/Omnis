import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import { FalService } from "../fal/fal.service.js"
import { OpenAIService } from "../openai/openai.service.js"
import { FAL_FLUX_MODELS, DEFAULT_FAL_FLUX_MODEL } from "../fal/fal.models.js"
import {
  OPENAI_DEFAULT_MODEL,
  OPENAI_IMAGE_MODELS,
} from "../openai/openai.models.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { calculateImageCredits } from "../credits/credits.config.js"
import {
  CreateImageGenerationDto,
  FLUX_MODEL_VALUES,
  MAX_REFERENCE_IMAGE_BYTES,
  OPENAI_MODEL_VALUES,
  REFERENCE_IMAGE_MIME_TYPES,
  type Provider,
} from "./dto/create-image-generation.dto.js"

const IMAGE_TYPE = "image"
const IMAGE_STATUS = "completed"
const MAX_REFERENCE_GUIDANCE_LENGTH = 700

type ReferenceImageUpload = {
  buffer: Buffer
  mimetype: string
  originalname?: string
  size: number
}

const STYLE_PROMPTS: Record<string, string> = {
  realistic: "photorealistic, natural colors, believable materials, crisp real-world detail",
  cinematic: "cinematic composition, dramatic but tasteful lighting, filmic color grading, depth of field",
  anime: "premium anime illustration, expressive character design, clean linework, polished cel shading",
  "digital-art": "high-end digital art, rich detail, harmonious color palette, refined concept art finish",
  "product-photography": "commercial product photography, studio lighting, clean background, premium advertising look",
  "3d-render": "high-quality 3D render, global illumination, detailed materials, polished octane-style finish",
}

const QUALITY_PROMPTS: Record<string, string> = {
  standard: "clean composition, sharp focus, balanced lighting",
  high: "high detail, professional composition, refined lighting, premium visual finish",
  ultra: "ultra-detailed, masterpiece quality, striking composition, luxurious lighting, award-winning finish",
}

export type GenerationProviderMeta = {
  provider: Provider
  model: string
  modelLabel: string
  cost: number
  imageUrl: string
  jobId: string
  creditsRemaining: number
}

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly falService: FalService,
    private readonly openaiService: OpenAIService,
  ) {}

  async createImageGeneration(
    userId: string,
    dto: CreateImageGenerationDto,
    referenceImage?: ReferenceImageUpload,
  ) {
    const prompt = dto.prompt.trim()
    if (!prompt) {
      throw new BadRequestException("Prompt is required")
    }

    const { provider, modelVersion, modelLabel, modelKey } = this.resolveProviderAndModel(
      dto.provider,
      dto.modelVersion ?? dto.model,
    )

    const cost = calculateImageCredits(modelKey, dto.quality)

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true },
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    if (user.credits < cost) {
      throw new HttpException("Insufficient credits", HttpStatus.PAYMENT_REQUIRED)
    }

    const referenceGuidance = referenceImage
      ? await this.createReferenceGuidance(prompt, referenceImage)
      : undefined

    const enhancedPrompt = this.buildEnhancedPrompt(prompt, dto, provider, modelKey, referenceGuidance)

    const { imageUrl, model: returnedModel } = await this.dispatchGeneration(
      provider,
      modelKey,
      enhancedPrompt,
      dto.imageSize,
      dto.quality,
    )

    const finalModelLabel = modelLabel ?? returnedModel

    const result = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.user.updateMany({
        where: { id: userId, credits: { gte: cost } },
        data: { credits: { decrement: cost } },
      })

      if (updateResult.count === 0) {
        throw new HttpException("Insufficient credits", HttpStatus.PAYMENT_REQUIRED)
      }

      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      if (!updatedUser) {
        throw new NotFoundException("User not found")
      }

      const job = await tx.generationJob.create({
        data: {
          userId,
          type: IMAGE_TYPE,
          prompt: referenceGuidance ? `${prompt}\n\nInspired by reference image.` : prompt,
          model: `${provider}:${finalModelLabel}`,
          creditsUsed: cost,
          status: IMAGE_STATUS,
          imageUrl: imageUrl,
        },
        select: {
          id: true,
          imageUrl: true,
        },
      })

      return { updatedUser, job }
    })

    this.logger.log(
      `Image generation (${provider}/${finalModelLabel}) completed for user ${userId} (job ${result.job.id}, cost=${cost} credits)`,
    )

    return {
      success: true,
      provider,
      model: finalModelLabel,
      modelKey,
      jobId: result.job.id,
      creditsUsed: cost,
      creditsRemaining: result.updatedUser.credits,
      imageUrl: result.job.imageUrl,
    }
  }

  async getHistory(userId: string) {
    return this.prisma.generationJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  }

  async getPublic() {
    return this.prisma.generationJob.findMany({
      where: { status: "completed", imageUrl: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        imageUrl: true,
        prompt: true,
        model: true,
        createdAt: true,
      },
    });
  }

  async getStats(userId: string) {
    const [user, totalGenerations, totalImages] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      }),
      this.prisma.generationJob.count({ where: { userId } }),
      this.prisma.generationJob.count({ where: { userId, type: IMAGE_TYPE } }),
    ])

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return {
      creditsRemaining: user.credits,
      totalGenerations,
      totalImages,
    }
  }

  private resolveProviderAndModel(
    providerInput: Provider | undefined,
    modelInput: string | undefined,
  ): {
    provider: Provider
    modelVersion: string
    modelKey: string
    modelLabel: string
  } {
    const normalizedModel = modelInput?.trim()

    if (providerInput === "openai") {
      const candidate = normalizedModel && (OPENAI_MODEL_VALUES as readonly string[]).includes(normalizedModel)
        ? normalizedModel
        : OPENAI_DEFAULT_MODEL
      return {
        provider: "openai",
        modelVersion: candidate,
        modelKey: candidate,
        modelLabel: candidate,
      }
    }

    if (providerInput === "flux") {
      const candidate = normalizedModel && (FLUX_MODEL_VALUES as readonly string[]).includes(normalizedModel)
        ? normalizedModel
        : DEFAULT_FAL_FLUX_MODEL
      const cfg = FAL_FLUX_MODELS.find((m) => m.value === candidate)!
      return {
        provider: "flux",
        modelVersion: candidate,
        modelKey: candidate,
        modelLabel: cfg.modelId,
      }
    }

    if (normalizedModel && (OPENAI_MODEL_VALUES as readonly string[]).includes(normalizedModel)) {
      return {
        provider: "openai",
        modelVersion: normalizedModel,
        modelKey: normalizedModel,
        modelLabel: normalizedModel,
      }
    }

    if (normalizedModel && (FLUX_MODEL_VALUES as readonly string[]).includes(normalizedModel)) {
      const cfg = FAL_FLUX_MODELS.find((m) => m.value === normalizedModel)!
      return {
        provider: "flux",
        modelVersion: normalizedModel,
        modelKey: normalizedModel,
        modelLabel: cfg.modelId,
      }
    }

    if (normalizedModel) {
      const lowered = normalizedModel.toLowerCase()
      if (OPENAI_IMAGE_MODELS.some((m) => m.toLowerCase() === lowered)) {
        return {
          provider: "openai",
          modelVersion: lowered,
          modelKey: lowered,
          modelLabel: lowered,
        }
      }
      if (/gpt|image|dall[- ]?e/i.test(lowered)) {
      return {
        provider: "openai",
        modelVersion: normalizedModel,
        modelKey: normalizedModel,
        modelLabel: normalizedModel,
      }
      }
      if (/premium/i.test(lowered)) {
        return {
          provider: "flux",
          modelVersion: "flux-dev",
          modelKey: "flux-dev",
          modelLabel: FAL_FLUX_MODELS.find((m) => m.value === "flux-dev")!.modelId,
        }
      }
    }

    return {
      provider: "flux",
      modelVersion: DEFAULT_FAL_FLUX_MODEL,
      modelKey: DEFAULT_FAL_FLUX_MODEL,
      modelLabel: FAL_FLUX_MODELS.find((m) => m.value === DEFAULT_FAL_FLUX_MODEL)!.modelId,
    }
  }

  private async dispatchGeneration(
    provider: Provider,
    modelKey: string,
    prompt: string,
    imageSize: string | undefined,
    quality: string | undefined,
  ) {
    if (provider === "openai") {
      const size = this.mapOpenAISize(modelKey, imageSize)
      return this.openaiService.generateImage({
        prompt,
        model: modelKey,
        size,
        quality: this.mapOpenAIQuality(quality),
      })
    }

    return this.falService.generateImage({
      prompt,
      model: modelKey,
      imageSize,
    })
  }

  private mapOpenAISize(_modelKey: string, size?: string): string {
    if (!size) return "1024x1024"
    if (
      size === "1024x1024" ||
      size === "1024x1536" ||
      size === "1536x1024" ||
      size === "auto"
    ) {
      return size
    }
    return "1024x1024"
  }

  private mapOpenAIQuality(
    quality: string | undefined,
  ): "low" | "medium" | "high" | "auto" | undefined {
    if (!quality) return undefined
    if (quality === "ultra") return "high"
    if (quality === "high") return "high"
    if (quality === "standard") return "low"
    return undefined
  }

  private buildEnhancedPrompt(
    prompt: string,
    dto: CreateImageGenerationDto,
    provider: Provider,
    modelKey: string,
    referenceGuidance?: string,
  ) {
    const stylePrompt = dto.style ? STYLE_PROMPTS[dto.style] : undefined
    const qualityPrompt = dto.quality ? QUALITY_PROMPTS[dto.quality] : QUALITY_PROMPTS.high

    const modelPrompt =
      provider === "openai"
        ? /gpt-image-2/.test(modelKey)
          ? "premium, highly polished, visually striking composition"
          : "professional generation, clear subject, strong visual readability"
        : modelKey === "flux-pro"
          ? "premium Flux Pro, highly polished, visually impressive"
          : modelKey === "flux-dev"
            ? "high quality Flux Dev generation, refined details, strong composition"
            : "fast professional generation, clear subject, strong visual readability"

    return [
      prompt,
      referenceGuidance
        ? `Reference image inspiration: ${referenceGuidance}`
        : undefined,
      stylePrompt,
      qualityPrompt,
      modelPrompt,
      "intentional framing, no text artifacts, no watermark, no distorted hands, no deformed anatomy, no low-resolution blur",
    ]
      .filter(Boolean)
      .join(", ")
  }

  private async createReferenceGuidance(prompt: string, image: ReferenceImageUpload) {
    this.validateReferenceImage(image)

    const dataUrl = `data:${image.mimetype};base64,${image.buffer.toString("base64")}`
    const guidance = await this.openaiService.describeReferenceImage({
      dataUrl,
      prompt,
    })

    return guidance.trim().slice(0, MAX_REFERENCE_GUIDANCE_LENGTH)
  }

  private validateReferenceImage(image: ReferenceImageUpload) {
    if (!image.buffer || image.buffer.length === 0) {
      throw new BadRequestException("Reference image is empty")
    }

    if (image.size > MAX_REFERENCE_IMAGE_BYTES || image.buffer.length > MAX_REFERENCE_IMAGE_BYTES) {
      throw new BadRequestException("Reference image must be 4MB or smaller")
    }

    if (!(REFERENCE_IMAGE_MIME_TYPES as readonly string[]).includes(image.mimetype)) {
      throw new BadRequestException("Reference image must be a JPG, PNG, or WebP file")
    }

    const signature = image.buffer.subarray(0, 12)
    const isJpeg = signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
    const isPng =
      signature[0] === 0x89 &&
      signature[1] === 0x50 &&
      signature[2] === 0x4e &&
      signature[3] === 0x47
    const isWebp =
      signature.toString("ascii", 0, 4) === "RIFF" &&
      signature.toString("ascii", 8, 12) === "WEBP"

    const matchesMime =
      (image.mimetype === "image/jpeg" && isJpeg) ||
      (image.mimetype === "image/png" && isPng) ||
      (image.mimetype === "image/webp" && isWebp)

    if (!matchesMime) {
      throw new BadRequestException("Reference image content does not match its file type")
    }
  }
}
