import { Module } from "@nestjs/common"
import { FalModule } from "../fal/fal.module.js"
import { OpenAIModule } from "../openai/openai.module.js"
import { GenerationsController } from "./generations.controller.js"
import { GenerationsService } from "./generations.service.js"

@Module({
  imports: [FalModule, OpenAIModule],
  controllers: [GenerationsController],
  providers: [GenerationsService],
})
export class GenerationsModule {}
