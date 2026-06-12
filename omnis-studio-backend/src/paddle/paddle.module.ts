import { Module } from "@nestjs/common"
import { PaddleController } from "./paddle.controller.js"
import { PaddleService } from "./paddle.service.js"
import { PrismaModule } from "../prisma/prisma.module.js"

@Module({
  imports: [PrismaModule],
  controllers: [PaddleController],
  providers: [PaddleService],
  exports: [PaddleService],
})
export class PaddleModule {}
