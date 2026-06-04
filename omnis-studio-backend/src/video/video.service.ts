import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import fal from "@fal-ai/serverless-client";
import { CreateVideoDto } from "./dto/create-video.dto.js";
import { EstimateCostDto } from "./dto/estimate-cost.dto.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { calculateVideoCredits } from "../credits/credits.config.js";

interface FalVideoResult {
  video?: {
    url: string;
  };
}

@Injectable()
export class VideoService implements OnModuleInit {
  private readonly logger = new Logger(VideoService.name);
  private readonly defaultModel = "Wan 2.5";

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initializes the Fal AI SDK with credentials and validates configuration.
   * Throws an error if the FAL_API_KEY is not configured.
   */
  onModuleInit() {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      this.logger.error("FAL_API_KEY is not set in environment variables.");
      throw new Error("FAL_API_KEY is not set");
    }

    // Configure the fal client credentials
    fal.config({ credentials: apiKey });
    this.logger.log("VideoService successfully initialized and FAL AI client configured.");
  }

  /**
   * Generates a video using Fal AI's Wan 2.5 model, deducting credits and storing the job.
   *
   * @param userId The authenticated user ID
   * @param params Parameters for video generation
   * @returns Generated video details and credit balance info
   */
  async generateVideo(userId: string, params: CreateVideoDto) {
    const { prompt, duration, resolution, aspectRatio, motionStrength, model } = params;

    const selectedModel = model || "fast-video";
    const creditsCost = calculateVideoCredits(selectedModel, duration, resolution);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, credits: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.credits < creditsCost) {
      throw new HttpException("Insufficient credits", HttpStatus.PAYMENT_REQUIRED);
    }

    try {
      this.logger.log(`Starting video generation for user ${userId}, prompt: "${prompt.substring(0, 30)}..."`);
      this.logger.log(`Params: model=${selectedModel}, duration=${duration}, resolution=${resolution}, aspectRatio=${aspectRatio}, motionStrength=${motionStrength ?? "default"}`);

      // Differentiate inference steps based on model speed/quality tier
      const inferenceSteps = selectedModel === "premium-video" ? 50 : 30;

      const result = await fal.subscribe("fal-ai/wan-25-preview/text-to-video", {
        input: {
          prompt,
          video_length: duration,
          resolution,
          aspect_ratio: aspectRatio,
          motion_strength: motionStrength ?? 5,
          num_inference_steps: inferenceSteps,
        },
        logs: true,
        onQueueUpdate: (update) => {
          this.logger.log(`Fal AI Video Queue Status: ${update.status}`);
        },
      }) as any;

      this.logger.debug(`Fal AI Result: ${JSON.stringify(result, null, 2)}`);

      const videoUrl = result?.video?.url || result?.data?.video?.url;
      if (!videoUrl) {
        throw new Error("FAL AI response did not contain a video URL.");
      }

      this.logger.log(`Video generation succeeded. URL: ${videoUrl}`);

      const transactionResult = await this.prisma.$transaction(async (tx) => {
        const updateResult = await tx.user.updateMany({
          where: { id: userId, credits: { gte: creditsCost } },
          data: { credits: { decrement: creditsCost } },
        });

        if (updateResult.count === 0) {
          throw new HttpException("Insufficient credits", HttpStatus.PAYMENT_REQUIRED);
        }

        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (!updatedUser) {
          throw new NotFoundException("User not found");
        }

        const job = await tx.generationJob.create({
          data: {
            userId,
            type: "video",
            prompt,
            model: `fal:${selectedModel}`,
            creditsUsed: creditsCost,
            status: "completed",
            imageUrl: videoUrl,
          },
          select: {
            id: true,
            imageUrl: true,
          },
        });

        return { updatedUser, job };
      });

      return {
        success: true,
        jobId: transactionResult.job.id,
        videoUrl: transactionResult.job.imageUrl,
        duration: parseInt(duration.replace("s", ""), 10) || 5,
        creditsUsed: creditsCost,
        creditsRemaining: transactionResult.updatedUser.credits,
        model: selectedModel,
      };
    } catch (error: any) {
      this.logger.error(`Video generation failed: ${error.message || error}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Video generation failed: ${error.message || error}`);
    }
  }

  /**
   * Estimates the cost of a video generation request without calling Fal AI.
   *
   * @param params Parameters for cost estimation
   * @returns Cost estimation details
   */
  estimateCost(params: EstimateCostDto) {
    const { duration, resolution, model } = params;
    const selectedModel = model || "fast-video";
    const creditsCost = calculateVideoCredits(selectedModel, duration, resolution);

    return {
      creditsCost,
      model: selectedModel,
    };
  }

  /**
   * Fetches video generation history for the user.
   *
   * @param userId The authenticated user ID
   * @returns List of video generation jobs
   */
  async getVideoHistory(userId: string) {
    return this.prisma.generationJob.findMany({
      where: { userId, type: "video" },
      orderBy: { createdAt: "desc" },
    });
  }
}
