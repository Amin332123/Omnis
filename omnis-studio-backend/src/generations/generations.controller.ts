import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { EmailVerifiedGuard } from "../auth/guards/email-verified.guard.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { GenerationsService } from "./generations.service.js";
import {
  CreateImageGenerationDto,
  MAX_REFERENCE_IMAGE_BYTES,
  REFERENCE_IMAGE_MIME_TYPES,
} from "./dto/create-image-generation.dto.js";

type AuthenticatedUser = {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
};

export type UploadedReferenceImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@ApiTags("generations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller("generations")
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Post("image")
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor("referenceImage", {
      limits: { fileSize: MAX_REFERENCE_IMAGE_BYTES, files: 1 },
      fileFilter: (_req, file, callback) => {
        if ((REFERENCE_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
          callback(null, true);
          return;
        }

        callback(
          new BadRequestException("Reference image must be a JPG, PNG, or WebP file."),
          false,
        );
      },
    }),
  )
  @ApiOperation({ summary: "Create an image generation job" })
  @ApiResponse({
    status: 200,
    description: "Image generation job created.",
  })
  @ApiResponse({
    status: 402,
    description: "Insufficient credits",
  })
  createImageGeneration(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateImageGenerationDto,
    @UploadedFile() referenceImage?: UploadedReferenceImage,
  ) {
    return this.generationsService.createImageGeneration(req.user.id, dto, referenceImage);
  }

  @Get("history")
  @ApiOperation({ summary: "Get generation history" })
  @ApiResponse({
    status: 200,
    description: "Generation history ordered by newest first.",
  })
  getHistory(@Req() req: { user: AuthenticatedUser }) {
    return this.generationsService.getHistory(req.user.id);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get generation stats" })
  @ApiResponse({
    status: 200,
    description: "Generation stats for the authenticated user.",
  })
  getStats(@Req() req: { user: AuthenticatedUser }) {
    return this.generationsService.getStats(req.user.id);
  }
}
