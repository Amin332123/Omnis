export const FAL_FLUX_MODELS = [
  {
    value: "flux-schnell",
    label: "Flux Schnell",
    description: "Fastest Flux, 1-4 steps, ideal for quick iterations",
    endpoint: "https://fal.run/fal-ai/flux/schnell",
    modelId: "fal-ai/flux/schnell",
  },
  {
    value: "flux-dev",
    label: "Flux Dev",
    description: "Higher quality, ~20-50 steps, great for production",
    endpoint: "https://fal.run/fal-ai/flux/dev",
    modelId: "fal-ai/flux/dev",
  },
  {
    value: "flux-pro",
    label: "Flux Pro",
    description: "Best Flux quality via fal.ai Pro endpoint",
    endpoint: "https://fal.run/fal-ai/flux-pro/v1.1",
    modelId: "fal-ai/flux-pro/v1.1",
  },
] as const

export type FalFluxModelValue = (typeof FAL_FLUX_MODELS)[number]["value"]

export const isFalFluxModel = (value: unknown): value is FalFluxModelValue => {
  if (typeof value !== "string") return false
  return FAL_FLUX_MODELS.some((model) => model.value === value)
}

export const DEFAULT_FAL_FLUX_MODEL: FalFluxModelValue = "flux-schnell"
