import { Controller, Get, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js"
import { getCreditsConfig } from "./credits.config.js"

@ApiTags("credits")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("credits")
export class CreditsController {
  @Get("config")
  @ApiOperation({ summary: "Get the credits cost configuration for the UI" })
  config() {
    return getCreditsConfig()
  }
}
