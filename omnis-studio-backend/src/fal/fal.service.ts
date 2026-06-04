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
import {
  DEFAULT_FAL_FLUX_MODEL,
  FAL_FLUX_MODELS,
  isFalFluxModel,
  type FalFluxModelValue,
} from "./fal.models.js"

const FAL_TIMEOUT_MS = 90_000
const RETRY_DELAYS_MS = [1000, 2000]

type FalImageSize = "square_hd" | "landscape_hd" | "portrait_hd"

type FalImageResult = {
  imageUrl: string
  model: string
}

type FalImageResponse = {
  images?: Array<{
    url?: string
    width?: number
    height?: number
    content_type?: string
  }>
}

export type FalGenerateImageParams = {
  prompt: string
  model?: string
  imageSize?: string
  numInferenceSteps?: number
  guidanceScale?: number
}

@Injectable()
export class FalService {
  private readonly logger = new Logger(FalService.name)
  private readonly apiKey: string

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>("FAL_API_KEY")
    if (!apiKey) {
      throw new Error("FAL_API_KEY is required to start the server")
    }

    this.apiKey = apiKey
  }

  async generateImage(params: FalGenerateImageParams): Promise<FalImageResult> {
    const trimmedPrompt = params.prompt.trim()
    if (!trimmedPrompt) {
      throw new BadRequestException("Prompt is required")
    }

    const modelValue: FalFluxModelValue = isFalFluxModel(params.model)
      ? params.model
      : DEFAULT_FAL_FLUX_MODEL
    const modelConfig = FAL_FLUX_MODELS.find((m) => m.value === modelValue)!
    const mappedImageSize = this.mapImageSize(params.imageSize)
    const numInferenceSteps = this.resolveSteps(modelValue, params.numInferenceSteps)

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await this.postToFal(modelConfig.endpoint, {
          prompt: trimmedPrompt,
          image_size: mappedImageSize,
          num_inference_steps: numInferenceSteps,
          guidance_scale: params.guidanceScale,
          enable_safety_checker: true,
        })
        const imageUrl = response.images?.[0]?.url

        if (!imageUrl) {
          this.logger.error(`Fal.ai did not return an image URL for ${modelConfig.modelId}`)
          throw new ServiceUnavailableException("Fal.ai did not return an image URL")
        }

        return { imageUrl, model: modelConfig.modelId }
      } catch (error) {
        if (this.shouldRetry(error) && attempt < RETRY_DELAYS_MS.length) {
          const delay = RETRY_DELAYS_MS[attempt]
          this.logger.warn(
            `Fal.ai image generation failed. Retrying in ${delay}ms (model=${modelConfig.modelId}).`,
          )
          await this.sleep(delay)
          continue
        }

        const mapped = this.mapToHttpException(error)
        this.logger.error(
          `Fal.ai image generation failed: ${this.normalizeErrorMessage(error)} status=${this.getErrorStatus(error)} model=${modelConfig.modelId}`,
          error instanceof Error ? error.stack : undefined,
        )
        throw mapped
      }
    }

    throw new ServiceUnavailableException("Fal.ai image generation failed")
  }

  private async postToFal(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<FalImageResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FAL_TIMEOUT_MS)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const message = await this.readFalError(response)
        throw new FalHttpError(message, response.status)
      }

      return (await response.json()) as FalImageResponse
    } catch (error) {
      if (error instanceof FalHttpError) throw error
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError("Fal.ai request timed out")
      }
      throw new NetworkError(this.normalizeErrorMessage(error))
    } finally {
      clearTimeout(timeout)
    }
  }

  private mapImageSize(imageSize?: string): FalImageSize {
    switch (imageSize) {
      case "landscape_hd":
      case "1216x832":
      case "1536x1024":
        return "landscape_hd"
      case "portrait_hd":
      case "832x1216":
      case "1024x1536":
      case "768x1344":
        return "portrait_hd"
      case "square_hd":
      case "1024x1024":
      case "auto":
      case undefined:
      case "":
        return "square_hd"
      default:
        throw new BadRequestException("Unsupported image size")
    }
  }

  private resolveSteps(model: FalFluxModelValue, requested?: number): number {
    if (typeof requested === "number" && Number.isFinite(requested)) {
      return Math.max(1, Math.min(50, Math.trunc(requested)))
    }
    if (model === "flux-schnell") return 4
    if (model === "flux-dev") return 28
    return 28
  }

  private shouldRetry(error: unknown) {
    const status = this.getErrorStatus(error)
    return (
      error instanceof TimeoutError ||
      error instanceof NetworkError ||
      status === 408 ||
      status === 429 ||
      Boolean(status && status >= 500)
    )
  }

  private mapToHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) return error

    const status = this.getErrorStatus(error)
    const message = this.getErrorMessage(error)

    if (error instanceof TimeoutError || status === 408) {
      return new GatewayTimeoutException("Fal.ai request timed out")
    }
    if (error instanceof NetworkError) {
      return new ServiceUnavailableException("Network error contacting Fal.ai")
    }
    if (status === 400) {
      return new BadRequestException(message || "Invalid image generation request")
    }
    if (status === 401) {
      return new HttpException(message || "Fal.ai authentication failed", HttpStatus.UNAUTHORIZED)
    }
    if (status === 403 && this.isBalanceError(message)) {
      return new HttpException(
        "Fal.ai balance exhausted. Please top up the Fal.ai account.",
        HttpStatus.PAYMENT_REQUIRED,
      )
    }
    if (status === 403) {
      return new ForbiddenException(message || "Fal.ai request is forbidden")
    }
    if (status === 402) {
      return new HttpException("Fal.ai quota exceeded", HttpStatus.PAYMENT_REQUIRED)
    }
    if (status === 429) {
      return new HttpException("Fal.ai rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS)
    }
    if (status === 422) {
      return new HttpException(
        message || "Your prompt was rejected by content safety. Please rephrase and try again.",
        422,
      )
    }
    if (status && status >= 500) {
      return new ServiceUnavailableException(message || "Fal.ai service unavailable")
    }

    return new HttpException(
      message || "Image generation failed",
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }

  private async readFalError(response: Response) {
    try {
      const payload = (await response.json()) as { message?: unknown; error?: unknown; detail?: unknown }
      const message = payload.message ?? payload.error ?? payload.detail
      return typeof message === "string" ? message : response.statusText
    } catch {
      return response.statusText
    }
  }

  private getErrorStatus(error: unknown) {
    if (error instanceof FalHttpError) return error.status
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status?: unknown }).status
      return typeof status === "number" ? status : Number.isNaN(Number(status)) ? undefined : Number(status)
    }
    return undefined
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    if (typeof error === "object" && error !== null && "message" in error) {
      const message = (error as { message?: unknown }).message
      return typeof message === "string" ? message : undefined
    }
    return undefined
  }

  private isBalanceError(message?: string) {
    return Boolean(message && /exhausted balance|locked|top up/i.test(message))
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

class FalHttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

class TimeoutError extends Error {}
class NetworkError extends Error {}
