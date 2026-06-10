import { Controller, Get, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { EmailVerifiedGuard } from "../auth/guards/email-verified.guard.js"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { getCreditsConfig } from "./credits.config.js"

@ApiTags("credits")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller("credits")
export class CreditsController {
  @Get("config")
  @ApiOperation({ summary: "Get the credits cost configuration for the UI" })
  config() {
    return getCreditsConfig()
  }
}
