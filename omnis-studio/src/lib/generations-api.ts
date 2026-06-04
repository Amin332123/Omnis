import { apiFetch } from "@/lib/api"

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

export const createImageGeneration = (payload: CreateImageGenerationPayload) =>
  apiFetch<CreateImageGenerationResponse>("/generations/image", {
    method: "POST",
    body: payload,
  })

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

