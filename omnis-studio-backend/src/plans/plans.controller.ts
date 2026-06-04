import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PlansService } from "./plans.service.js";

@ApiTags("plans")
@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: "List all active credit plans" })
  @ApiOkResponse({ description: "Active plans" })
  async listActive() {
    return this.plansService.findActive();
  }
}
