import { Controller, Get, UseGuards, Req } from "@nestjs/common"
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { EmailVerifiedGuard } from "../auth/guards/email-verified.guard.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { getCreditsConfig } from "./credits.config.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { TransactionResponseDto } from "./dto/transaction-response.dto.js"
import type { Request } from "express"

@ApiTags("credits")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller("credits")
export class CreditsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("config")
  @ApiOperation({ summary: "Get the credits cost configuration for the UI" })
  config() {
    return getCreditsConfig()
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get the current user's credit purchase transactions" })
  @ApiOkResponse({ type: [TransactionResponseDto] })
  async transactions(@Req() req: Request) {
    const user = req.user as { id: string }
    return this.prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  }
}
