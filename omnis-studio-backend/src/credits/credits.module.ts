import { Module } from "@nestjs/common"
import { CreditsController } from "./credits.controller.js"
import { PrismaModule } from "../prisma/prisma.module.js"

@Module({
  imports: [PrismaModule],
  controllers: [CreditsController],
})
export class CreditsModule {}
