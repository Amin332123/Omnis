import { ApiError, apiFetch, getStoredToken } from "@/lib/api"

export type GenerationJob = {
  id: string
  userId: string
  type: "image" | "video"
  prompt: string
  model: string
  creditsUsed: number
  status: "completed" | "processing" | "failed"
  imageUrl?: string | null
  outputUrl?: string | null
  createdAt: string
}

export type GenerationStats = {
  creditsRemaining: number
  totalGenerations: number
  totalImages: number
}

export type ImageProvider = "flux" | "openai"

export type FluxModelVersion = "flux-schnell" | "flux-dev" | "flux-pro"

export type OpenAIModelVersion =
  | "gpt-image-1"
  | "gpt-image-1-mini"
  | "gpt-image-1.5"
  | "gpt-image-2"
  | "gpt-image-2-2026-04-21"

export type ImageModelVersion = FluxModelVersion | OpenAIModelVersion

export type CreateImageGenerationPayload = {
  prompt: string
  model?: string
  provider?: ImageProvider
  modelVersion?: ImageModelVersion
  imageSize?: string
  style?: string
  quality?: string
  referenceImage?: File
}

export type CreateImageGenerationResponse = {
  success: boolean
  jobId: string
  provider: ImageProvider
  model: string
  modelKey?: string
  creditsUsed: number
  creditsRemaining: number
  imageUrl: string
}

export type CreditsConfig = {
  signupBonus: number
  lowCreditThreshold: number
  qualityMultipliers: { standard: number; high: number; ultra: number }
  models: {
    flux: Array<{ value: string; label: string; baseCost: number }>
    openai: Array<{ value: string; baseCost: number }>
  }
}

const createImageGenerationWithReference = async (payload: CreateImageGenerationPayload) => {
  const formData = new FormData()
  formData.append("prompt", payload.prompt)
  if (payload.model) formData.append("model", payload.model)
  if (payload.provider) formData.append("provider", payload.provider)
  if (payload.modelVersion) formData.append("modelVersion", payload.modelVersion)
  if (payload.imageSize) formData.append("imageSize", payload.imageSize)
  if (payload.style) formData.append("style", payload.style)
  if (payload.quality) formData.append("quality", payload.quality)
  if (payload.referenceImage) formData.append("referenceImage", payload.referenceImage)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
  const token = getStoredToken()
  const response = await fetch(`${baseUrl}/generations/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const data = (await response.json().catch(() => null)) as
    | CreateImageGenerationResponse
    | { message?: string | string[] }
    | null

  if (!response.ok) {
    const rawMessage = data && "message" in data ? data.message : undefined
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage || response.statusText || "Image generation failed"
    throw new ApiError(response.status, message, data)
  }

  return data as CreateImageGenerationResponse
}

export const createImageGeneration = (payload: CreateImageGenerationPayload) => {
  if (payload.referenceImage) {
    return createImageGenerationWithReference(payload)
  }

  const { referenceImage: _referenceImage, ...jsonPayload } = payload
  return apiFetch<CreateImageGenerationResponse>("/generations/image", {
    method: "POST",
    body: jsonPayload,
  })
}

export type CreateVideoGenerationPayload = {
  prompt: string
  duration: string
  resolution: string
  aspectRatio: string
  motionStrength?: number
  model?: string
}

export type CreateVideoGenerationResponse = {
  success: boolean
  jobId: string
  videoUrl: string
  duration: number
  creditsUsed: number
  creditsRemaining: number
  model: string
}

export type EstimateVideoCostPayload = {
  duration: string
  resolution: string
  model?: string
}

export type EstimateVideoCostResponse = {
  creditsCost: number
  model: string
}

export const createVideoGeneration = (payload: CreateVideoGenerationPayload) =>
  apiFetch<CreateVideoGenerationResponse>("/api/videos/generate", {
    method: "POST",
    body: payload,
  })

export const estimateVideoCost = (payload: EstimateVideoCostPayload) =>
  apiFetch<EstimateVideoCostResponse>("/api/videos/estimate-cost", {
    method: "POST",
    body: payload,
  })

export const getGenerationHistory = () => apiFetch<GenerationJob[]>("/generations/history")

export const getGenerationStats = () => apiFetch<GenerationStats>("/generations/stats")

export const getCreditsConfig = () => apiFetch<CreditsConfig>("/credits/config")
