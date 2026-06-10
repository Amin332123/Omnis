import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { EmailVerifiedGuard } from "../auth/guards/email-verified.guard.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { AdminGuard } from "./guards/admin.guard.js";
import { AdminService } from "./admin.service.js";
import { PlansService } from "../plans/plans.service.js";
import { CreatePlanDto } from "../plans/dto/create-plan.dto.js";
import { UpdatePlanDto } from "../plans/dto/update-plan.dto.js";
import { UpdateUserCreditsDto } from "./dto/update-user-credits.dto.js";
import { UpdateUserPasswordDto } from "./dto/update-user-password.dto.js";
import { ListAllGenerationsDto } from "./dto/list-all-generations.dto.js";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly plansService: PlansService,
  ) {}

  @Get("stats")
  @ApiOperation({ summary: "Get global admin stats" })
  getStats() {
    return this.adminService.getStats();
  }

  @Get("users")
  @ApiOperation({ summary: "List users (paginated)" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "query", required: false, type: String, example: "gmail.com" })
  listUsers(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("pageSize", new ParseIntPipe({ optional: true })) pageSize = 20,
    @Query("query") query?: string,
  ) {
    return this.adminService.listUsers(page, pageSize, query);
  }

  @Patch("users/:userId/credits")
  @ApiOperation({ summary: "Set a user's credit balance" })
  @ApiParam({ name: "userId", type: String })
  updateUserCredits(
    @Param("userId") userId: string,
    @Body() dto: UpdateUserCreditsDto,
  ) {
    return this.adminService.updateUserCredits(userId, dto);
  }

  @Delete("users/:userId")
  @ApiOperation({ summary: "Delete a user" })
  @ApiParam({ name: "userId", type: String })
  deleteUser(@Param("userId") userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Patch("users/:userId/password")
  @ApiOperation({ summary: "Reset a user's password" })
  @ApiParam({ name: "userId", type: String })
  updateUserPassword(
    @Param("userId") userId: string,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.adminService.updateUserPassword(userId, dto);
  }

  @Get("charts/credits-usage")
  @ApiOperation({ summary: "Credit usage series (for charts)" })
  @ApiQuery({ name: "days", required: false, type: Number, example: 14 })
  creditsUsageSeries(@Query("days", new ParseIntPipe({ optional: true })) days = 14) {
    return this.adminService.getCreditUsageSeries(days);
  }

  @Get("charts/new-users")
  @ApiOperation({ summary: "New users series (for charts)" })
  @ApiQuery({ name: "days", required: false, type: Number, example: 14 })
  newUsersSeries(@Query("days", new ParseIntPipe({ optional: true })) days = 14) {
    return this.adminService.getNewUsersSeries(days);
  }

  @Get("plans")
  @ApiOperation({ summary: "List all plans (including inactive)" })
  listPlans() {
    return this.plansService.findAll();
  }

  @Post("plans")
  @ApiOperation({ summary: "Create a credit plan" })
  createPlan(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch("plans/:id")
  @ApiOperation({ summary: "Update a credit plan" })
  @ApiParam({ name: "id", type: String })
  updatePlan(@Param("id") id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete("plans/:id")
  @ApiOperation({ summary: "Delete a credit plan" })
  @ApiParam({ name: "id", type: String })
  deletePlan(@Param("id") id: string) {
    return this.plansService.remove(id);
  }

  @Get("preferred-content")
  @ApiOperation({ summary: "Get the six preferred homepage image slots" })
  getPreferredContent() {
    return this.adminService.getPreferredHomepageContent();
  }

  @Patch("preferred-content/:slot")
  @ApiOperation({ summary: "Set a preferred homepage image slot" })
  @ApiParam({ name: "slot", type: Number })
  setPreferredContent(
    @Param("slot", ParseIntPipe) slot: number,
    @Body() dto: { generationId: string },
  ) {
    return this.adminService.setPreferredHomepageContent(slot, dto.generationId);
  }

  @Delete("preferred-content/:slot")
  @ApiOperation({ summary: "Clear a preferred homepage image slot" })
  @ApiParam({ name: "slot", type: Number })
  clearPreferredContent(@Param("slot", ParseIntPipe) slot: number) {
    return this.adminService.clearPreferredHomepageContent(slot);
  }

  @Get("generations")
  @ApiOperation({ summary: "List all generations across all users with filtering" })
  @ApiQuery({ name: "type", required: false, enum: ["image", "video"] })
  @ApiQuery({ name: "status", required: false, enum: ["completed", "processing", "failed"] })
  @ApiQuery({ name: "search", required: false, type: String, example: "cat" })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, type: Number, example: 20 })
  @ApiQuery({ name: "userId", required: false, type: String })
  listAllGenerations(@Query() dto: ListAllGenerationsDto) {
    return this.adminService.listAllGenerations({
      type: dto.type,
      status: dto.status,
      search: dto.search,
      page: dto.page ?? 1,
      pageSize: dto.pageSize ?? 20,
      userId: dto.userId,
    });
  }
}
