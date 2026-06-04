import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { VideoService } from "./video.service.js";
import { CreateVideoDto } from "./dto/create-video.dto.js";
import { EstimateCostDto } from "./dto/estimate-cost.dto.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";

type AuthenticatedUser = {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
};

@ApiTags("videos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/videos")
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Endpoint to generate a video based on specified prompt and generation parameters.
   * Runs the generation on Fal AI and returns details of the generated video and its cost.
   *
   * @param req Express request containing the authenticated user
   * @param dto Data transfer object containing prompt, duration, resolution, aspectRatio, motionStrength and model
   */
  @Post("generate")
  @HttpCode(200)
  @ApiOperation({ summary: "Generate a video from a text prompt using Fal AI" })
  @ApiResponse({
    status: 200,
    description: "Video successfully generated.",
    schema: {
      example: {
        videoUrl: "https://v2.fal.media/files/monkey/some_video.mp4",
        duration: 5,
        creditsUsed: 15,
        creditsRemaining: 35,
        model: "Wan 2.5",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation error or invalid input parameters.",
  })
  @ApiResponse({
    status: 402,
    description: "Insufficient credits",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error during video generation.",
  })
  generateVideo(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateVideoDto,
  ) {
    return this.videoService.generateVideo(req.user.id, dto);
  }

  /**
   * Endpoint to estimate the cost of video generation.
   * Calculates the cost based on duration and model pricing without making any API calls.
   *
   * @param dto Data transfer object containing duration, resolution and model
   */
  @Post("estimate-cost")
  @HttpCode(200)
  @ApiOperation({ summary: "Estimate the cost of a video generation request without calling Fal AI" })
  @ApiResponse({
    status: 200,
    description: "Cost successfully estimated.",
    schema: {
      example: {
        creditsCost: 15,
        model: "fast-video",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation error or invalid input parameters.",
  })
  estimateCost(@Body() dto: EstimateCostDto) {
    return this.videoService.estimateCost(dto);
  }

  @Get("history")
  @ApiOperation({ summary: "Get video generation history" })
  @ApiResponse({
    status: 200,
    description: "Video generation history ordered by newest first.",
  })
  getVideoHistory(@Req() req: { user: AuthenticatedUser }) {
    return this.videoService.getVideoHistory(req.user.id);
  }
}
