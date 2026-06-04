import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { GenerationsService } from "./generations.service.js";
import { CreateImageGenerationDto } from "./dto/create-image-generation.dto.js";

type AuthenticatedUser = {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
};

@ApiTags("generations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("generations")
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Post("image")
  @HttpCode(200)
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
  ) {
    return this.generationsService.createImageGeneration(req.user.id, dto);
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
