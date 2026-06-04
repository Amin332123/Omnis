import { FAL_FLUX_MODELS, type FalFluxModelValue } from "../fal/fal.models.js"
import { OPENAI_IMAGE_MODELS, type OpenAIImageModel } from "../openai/openai.models.js"

export const SIGNUP_BONUS_CREDITS = 10
export const LOW_CREDIT_WARNING_THRESHOLD = 1

export const QUALITY_MULTIPLIERS = {
  standard: 1,
  high: 1.4,
  ultra: 1.8,
} as const

export type QualityTier = keyof typeof QUALITY_MULTIPLIERS

const FLUX_BASE_COST: Record<FalFluxModelValue, number> = {
  "flux-schnell": 0.5,
  "flux-dev": 1.2,
  "flux-pro": 2.5,
}

const OPENAI_BASE_COST: Record<OpenAIImageModel, number> = {
  "gpt-image-1-mini": 0.8,
  "gpt-image-1": 1.5,
  "gpt-image-1.5": 1.8,
  "gpt-image-2": 2.2,
  "gpt-image-2-2026-04-21": 2.2,
}

const ROUND_PRECISION = 2
const ROUND_FACTOR = 10 ** ROUND_PRECISION

const round = (value: number) => Math.round(value * ROUND_FACTOR) / ROUND_FACTOR

const isFluxModel = (value: string): value is FalFluxModelValue =>
  (FAL_FLUX_MODELS as readonly { value: string }[]).some((m) => m.value === value)

const isOpenAIModel = (value: string): value is OpenAIImageModel =>
  (OPENAI_IMAGE_MODELS as readonly string[]).includes(value)

export const calculateImageCredits = (
  modelKey: string,
  quality?: string,
): number => {
  const base = isFluxModel(modelKey)
    ? FLUX_BASE_COST[modelKey]
    : isOpenAIModel(modelKey)
      ? OPENAI_BASE_COST[modelKey]
      : FLUX_BASE_COST["flux-schnell"]

  const tier = (quality ?? "high") as QualityTier
  const multiplier = QUALITY_MULTIPLIERS[tier] ?? QUALITY_MULTIPLIERS.high

  return round(base * multiplier)
}

export const VIDEO_BASE_RATE_PER_SECOND = {
  "fast-video": 1.5,
  "premium-video": 3.0,
} as const

export const calculateVideoCredits = (
  model: string,
  duration: string,
  resolution: string,
): number => {
  const baseRate =
    VIDEO_BASE_RATE_PER_SECOND[model as keyof typeof VIDEO_BASE_RATE_PER_SECOND] ??
    VIDEO_BASE_RATE_PER_SECOND["fast-video"]
  const durationSeconds = parseInt(duration.replace("s", ""), 10) || 5
  const resMultiplier = resolution === "1080p" ? 1.5 : 1
  return Math.round(baseRate * durationSeconds * resMultiplier)
}

export const getCreditsConfig = () => ({
  signupBonus: SIGNUP_BONUS_CREDITS,
  lowCreditThreshold: LOW_CREDIT_WARNING_THRESHOLD,
  qualityMultipliers: { ...QUALITY_MULTIPLIERS },
  models: {
    flux: FAL_FLUX_MODELS.map((m) => ({
      value: m.value,
      label: m.label,
      baseCost: FLUX_BASE_COST[m.value],
    })),
    openai: OPENAI_IMAGE_MODELS.map((m) => ({
      value: m,
      baseCost: OPENAI_BASE_COST[m],
    })),
  },
  videoBaseRates: { ...VIDEO_BASE_RATE_PER_SECOND },
})
