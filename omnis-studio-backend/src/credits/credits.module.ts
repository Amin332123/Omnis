import { Module } from "@nestjs/common"
import { CreditsController } from "./credits.controller.js"

@Module({
  controllers: [CreditsController],
})
export class CreditsModule {}
