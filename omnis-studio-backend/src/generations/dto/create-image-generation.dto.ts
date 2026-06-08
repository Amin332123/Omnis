import { ApiProperty } from "@nestjs/swagger"
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator"

export const PROVIDER_VALUES = ["flux", "openai"] as const
export type Provider = (typeof PROVIDER_VALUES)[number]

export const FLUX_MODEL_VALUES = ["flux-schnell", "flux-dev", "flux-pro"] as const
export const OPENAI_MODEL_VALUES = [
  "gpt-image-1",
  "gpt-image-1-mini",
  "gpt-image-1.5",
  "gpt-image-2",
  "gpt-image-2-2026-04-21",
] as const

export const ALL_MODEL_VALUES = [...FLUX_MODEL_VALUES, ...OPENAI_MODEL_VALUES] as const

export const STYLE_VALUES = [
  "realistic",
  "cinematic",
  "anime",
  "digital-art",
  "product-photography",
  "3d-render",
] as const

export const SIZE_VALUES = [
  "square_hd",
  "portrait_hd",
  "landscape_hd",
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "832x1216",
  "1216x832",
  "768x1344",
  "auto",
] as const

export const QUALITY_VALUES = ["standard", "high", "ultra"] as const
export const REFERENCE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const MAX_REFERENCE_IMAGE_BYTES = 4 * 1024 * 1024

export class CreateImageGenerationDto {
  @ApiProperty({
    minLength: 5,
    example: "A serene mountain landscape at sunrise",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  prompt!: string

  @ApiProperty({
    required: false,
    description:
      "Legacy/optional friendly model label. When provider is also supplied, model must match that provider's catalog.",
    example: "flux-schnell",
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  model?: string

  @ApiProperty({
    required: false,
    enum: PROVIDER_VALUES,
    example: "flux",
    description: "Image generation provider. Defaults to 'flux' for backwards compatibility.",
  })
  @IsOptional()
  @IsString()
  @IsIn([...PROVIDER_VALUES])
  provider?: Provider

  @ApiProperty({
    required: false,
    enum: ALL_MODEL_VALUES,
    example: "flux-schnell",
    description:
      "Provider-specific model identifier. Required when provider is set; otherwise defaults are used.",
  })
  @IsOptional()
  @IsString()
  @IsIn([...ALL_MODEL_VALUES])
  modelVersion?: string

  @ApiProperty({
    required: false,
    enum: SIZE_VALUES,
    example: "landscape_hd",
  })
  @IsOptional()
  @IsString()
  @IsIn([...SIZE_VALUES])
  imageSize?: string

  @ApiProperty({
    required: false,
    enum: STYLE_VALUES,
    example: "cinematic",
  })
  @IsOptional()
  @IsString()
  @IsIn([...STYLE_VALUES])
  style?: string

  @ApiProperty({
    required: false,
    enum: QUALITY_VALUES,
    example: "high",
  })
  @IsOptional()
  @IsString()
  @IsIn([...QUALITY_VALUES])
  quality?: string
}
