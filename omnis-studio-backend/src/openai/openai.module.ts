import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { OpenAIService } from "./openai.service.js"

@Module({
  imports: [ConfigModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
