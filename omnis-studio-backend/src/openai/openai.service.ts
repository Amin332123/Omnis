import {
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import OpenAI, { APIError } from "openai"
import type {
  ImageGenerateParamsNonStreaming,
  ImagesResponse,
} from "openai/resources/images.js"
import {
  type OpenAIImageModel,
  isOpenAIImageModel,
  isOpenAIImageSize,
  OPENAI_DEFAULT_MODEL,
} from "./openai.models.js"

const RETRY_DELAYS_MS = [750, 1500]
const DEFAULT_OPENAI_SIZE: ImageGenerateParamsNonStreaming["size"] = "1024x1024"
const DEFAULT_QUALITY: "low" | "medium" | "high" = "high"
const DEFAULT_REFERENCE_ANALYSIS_MODEL = "gpt-4.1-mini"

export type OpenAIImageParams = {
  prompt: string
  model?: string
  size?: string
  quality?: "low" | "medium" | "high" | "auto"
  n?: number
}

export type OpenAIImageResult = {
  imageUrl: string
  model: string
  revisedPrompt?: string
}

export type OpenAIReferenceImageParams = {
  dataUrl: string
  prompt: string
  model?: string
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name)
  private readonly client: OpenAI
  private readonly apiKey: string
  private readonly referenceAnalysisModel: string

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>("OPENAI_API_KEY")
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required to start the server")
    }
    this.apiKey = apiKey
    this.referenceAnalysisModel =
      configService.get<string>("OPENAI_REFERENCE_ANALYSIS_MODEL") ||
      DEFAULT_REFERENCE_ANALYSIS_MODEL
    this.client = new OpenAI({ apiKey })
  }

  async generateImage(params: OpenAIImageParams): Promise<OpenAIImageResult> {
    const trimmedPrompt = params.prompt.trim()
    if (!trimmedPrompt) {
      throw new BadRequestException("Prompt is required")
    }

    const model: OpenAIImageModel = isOpenAIImageModel(params.model)
      ? params.model
      : OPENAI_DEFAULT_MODEL

    const size = this.resolveSize(params.size)
    const quality = this.resolveQuality(params.quality)
    const n = this.resolveN(params.n)

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await this.callImagesGenerate({
          model,
          prompt: trimmedPrompt,
          size,
          quality,
          n,
        })
        return this.extractImage(response, model)
      } catch (error) {
        if (this.shouldRetry(error) && attempt < RETRY_DELAYS_MS.length) {
          const delay = RETRY_DELAYS_MS[attempt]
          this.logger.warn(
            `OpenAI image generation failed. Retrying in ${delay}ms (model=${model}).`,
          )
          await this.sleep(delay)
          continue
        }

        const mapped = this.mapToHttpException(error)
        this.logger.error(
          `OpenAI image generation failed: ${this.normalizeErrorMessage(error)} model=${model}`,
          error instanceof Error ? error.stack : undefined,
        )
        throw mapped
      }
    }

    throw new ServiceUnavailableException("OpenAI image generation failed")
  }

  async describeReferenceImage(params: OpenAIReferenceImageParams): Promise<string> {
    if (!params.dataUrl.startsWith("data:image/")) {
      throw new BadRequestException("Reference image must be a valid image data URL")
    }

    try {
      const response = await this.client.chat.completions.create({
        model: params.model || this.referenceAnalysisModel,
        temperature: 0.2,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content:
              "You extract visual inspiration from a reference image for image generation. Describe reusable visual traits only: subject cues, composition, camera angle, lighting, palette, materials, mood, and style. Do not identify private people, read hidden text, or mention unsafe attributes. Keep it concise.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `User prompt: ${params.prompt}\n\nSummarize the reference image as generation guidance in 1 compact paragraph.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: params.dataUrl,
                  detail: "low",
                },
              },
            ],
          },
        ],
      } as any)

      const text = response.choices?.[0]?.message?.content?.trim()
      return text ? text.slice(0, 700) : ""
    } catch (error) {
      const mapped = this.mapToHttpException(error)
      this.logger.error(
        `OpenAI reference image analysis failed: ${this.normalizeErrorMessage(error)}`,
        error instanceof Error ? error.stack : undefined,
      )
      throw mapped
    }
  }

  private async callImagesGenerate(
    body: ImageGenerateParamsNonStreaming,
  ): Promise<ImagesResponse> {
    return this.client.images.generate(body)
  }

  private extractImage(response: ImagesResponse, model: OpenAIImageModel): OpenAIImageResult {
    const first = response.data?.[0]
    if (!first) {
      throw new ServiceUnavailableException("OpenAI did not return an image")
    }

    if (first.url) {
      return {
        imageUrl: first.url,
        model,
        revisedPrompt: first.revised_prompt ?? undefined,
      }
    }

    if (first.b64_json) {
      return {
        imageUrl: `data:image/png;base64,${first.b64_json}`,
        model,
        revisedPrompt: first.revised_prompt ?? undefined,
      }
    }

    throw new ServiceUnavailableException("OpenAI response did not contain an image")
  }

  private resolveSize(
    size?: string,
  ): ImageGenerateParamsNonStreaming["size"] {
    if (!size) return DEFAULT_OPENAI_SIZE
    if (!isOpenAIImageSize(size)) {
      throw new BadRequestException(`Unsupported image size: ${size}`)
    }
    return size
  }

  private resolveQuality(
    quality?: OpenAIImageParams["quality"],
  ): ImageGenerateParamsNonStreaming["quality"] | undefined {
    if (!quality) return undefined
    if (quality === "low" || quality === "medium" || quality === "high" || quality === "auto") {
      return quality
    }
    return DEFAULT_QUALITY
  }

  private resolveN(n?: number): number {
    if (!n) return 1
    return Math.max(1, Math.min(4, Math.trunc(n)))
  }

  private shouldRetry(error: unknown) {
    if (error instanceof APIError) {
      return (error as any).status === 408 || (error as any).status === 429 || (error as any).status >= 500
    }
    if (error instanceof TimeoutError) return true
    if (error instanceof NetworkError) return true
    return false
  }

  private mapToHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) return error

    if (error instanceof APIError) {
      const status = (error as any).status
      const message = (error as any).message || "OpenAI image generation failed"
      if (status === 400) {
        const friendly = this.friendlyBadRequest(message)
        return new BadRequestException(friendly)
      }
      if (status === 401) {
        return new HttpException(
          "OpenAI authentication failed. Please verify OPENAI_API_KEY.",
          HttpStatus.UNAUTHORIZED,
        )
      }
      if (status === 403) {
        if (/quota|billing|hard limit|exceeded/i.test(message)) {
          return new HttpException(
            "OpenAI quota exceeded. Please check your plan and billing details.",
            HttpStatus.PAYMENT_REQUIRED,
          )
        }
        return new ForbiddenException(message)
      }
      if (status === 404) {
        return new HttpException(
          "Requested OpenAI model is not available for this account.",
          HttpStatus.NOT_FOUND,
        )
      }
      if (status === 408) {
        return new GatewayTimeoutException("OpenAI request timed out")
      }
      if (status === 429) {
        return new HttpException(
          "OpenAI rate limit exceeded. Please try again in a few seconds.",
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      if (status === 422) {
        return new HttpException(
          message || "Your prompt was rejected by content safety. Please rephrase and try again.",
          422,
        )
      }
      if (status >= 500) {
        return new ServiceUnavailableException(
          message || "OpenAI service is temporarily unavailable.",
        )
      }
      return new HttpException(message, status || HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (error instanceof TimeoutError) {
      return new GatewayTimeoutException("OpenAI request timed out")
    }
    if (error instanceof NetworkError) {
      return new ServiceUnavailableException("Network error contacting OpenAI")
    }

    return new HttpException(
      this.normalizeErrorMessage(error) || "Image generation failed",
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }

  private friendlyBadRequest(message: string): string {
    if (/does not exist/i.test(message)) {
      return "The selected OpenAI model is not available on this account. Try a different model."
    }
    return message || "Invalid image generation request"
  }

  private normalizeErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    if (typeof error === "string") return error
    return "Unknown error"
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }
}

class TimeoutError extends Error {}
class NetworkError extends Error {}
