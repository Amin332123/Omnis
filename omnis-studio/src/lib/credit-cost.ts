export const SIGNUP_BONUS_CREDITS = 1
export const LOW_CREDIT_WARNING_THRESHOLD = 1

export const QUALITY_MULTIPLIERS = {
  standard: 1,
  high: 1.4,
  ultra: 1.8,
} as const

export type QualityTier = keyof typeof QUALITY_MULTIPLIERS

export const FLUX_BASE_COST: Record<string, number> = {
  "flux-schnell": 0.5,
  "flux-dev": 1.2,
  "flux-pro": 2.5,
}

export const OPENAI_BASE_COST: Record<string, number> = {
  "gpt-image-1-mini": 0.8,
  "gpt-image-1": 1.5,
  "gpt-image-1.5": 1.8,
  "gpt-image-2": 2.2,
  "gpt-image-2-2026-04-21": 2.2,
}

const round = (value: number) => Math.round(value * 100) / 100

export const calculateImageCredits = (
  modelKey: string,
  quality?: string,
): number => {
  const base =
    FLUX_BASE_COST[modelKey] ?? OPENAI_BASE_COST[modelKey] ?? FLUX_BASE_COST["flux-schnell"]

  const tier = (quality ?? "high") as QualityTier
  const multiplier = QUALITY_MULTIPLIERS[tier] ?? QUALITY_MULTIPLIERS.high

  return round(base * multiplier)
}

export const formatCredits = (value: number): string => {
  if (!Number.isFinite(value)) return "0"
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) return rounded.toString()
  return rounded.toFixed(2).replace(/\.?0+$/, "")
}
