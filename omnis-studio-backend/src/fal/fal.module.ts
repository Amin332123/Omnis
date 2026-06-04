import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { FalService } from "./fal.service.js"

@Module({
  imports: [ConfigModule],
  providers: [FalService],
  exports: [FalService],
})
export class FalModule {}
