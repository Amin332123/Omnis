import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { VideoDuration, VideoResolution } from "./create-video.dto.js";

export class EstimateCostDto {
  @ApiProperty({
    description: "The duration of the video to estimate cost for",
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
