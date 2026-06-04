export const OPENAI_IMAGE_MODELS = [
  "gpt-image-1",
  "gpt-image-1-mini",
  "gpt-image-1.5",
  "gpt-image-2",
  "gpt-image-2-2026-04-21",
] as const

export type OpenAIImageModel = (typeof OPENAI_IMAGE_MODELS)[number]

export const OPENAI_DEFAULT_MODEL: OpenAIImageModel = "gpt-image-1"

export const isOpenAIImageModel = (value: unknown): value is OpenAIImageModel =>
  typeof value === "string" && (OPENAI_IMAGE_MODELS as readonly string[]).includes(value)

export type OpenAIImageSize =
  | "1024x1024"
  | "1024x1536"
  | "1536x1024"
  | "auto"

export const isOpenAIImageSize = (value: unknown): value is OpenAIImageSize => {
  if (typeof value !== "string") return false
  return ["1024x1024", "1024x1536", "1536x1024", "auto"].includes(value)
}
