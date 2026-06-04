import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export enum VideoDuration {
  FIVE_SECONDS = "5s",
  TEN_SECONDS = "10s",
  FIFTEEN_SECONDS = "15s",
}

export enum VideoResolution {
  HD_720P = "720p",
  FHD_1080P = "1080p",
}

export enum VideoAspectRatio {
  RATIO_16_9 = "16:9",
  RATIO_9_16 = "9:16",
  RATIO_1_1 = "1:1",
  RATIO_4_3 = "4:3",
}

export class CreateVideoDto {
  @ApiProperty({
    description: "The prompt to generate the video from",
    minLength: 10,
    maxLength: 500,
    example: "A beautiful cinematic shot of a sunset over the ocean.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  prompt!: string;

  @ApiProperty({
    description: "The duration of the video",
    enum: VideoDuration,
    example: VideoDuration.FIVE_SECONDS,
  })
  @IsEnum(VideoDuration)
  @IsNotEmpty()
  duration!: VideoDuration;

  @ApiProperty({
    description: "The resolution of the video",
    enum: VideoResolution,
    example: VideoResolution.HD_720P,
  })
  @IsEnum(VideoResolution)
  @IsNotEmpty()
  resolution!: VideoResolution;

  @ApiProperty({
    description: "The aspect ratio of the video",
    enum: VideoAspectRatio,
    example: VideoAspectRatio.RATIO_16_9,
  })
  @IsEnum(VideoAspectRatio)
  @IsNotEmpty()
  aspectRatio!: VideoAspectRatio;

  @ApiProperty({
    description: "The strength of motion in the video, between 0 and 10",
    required: false,
    minimum: 0,
    maximum: 10,
    default: 5,
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  motionStrength?: number;

  @ApiProperty({
    description: "The video model to use",
    enum: ["fast-video", "premium-video"],
    default: "fast-video",
    required: false,
    example: "fast-video",
  })
  @IsOptional()
  @IsString()
  model?: string;
}
