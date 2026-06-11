import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module.js";
import { MailModule } from "./mail/mail.module.js";
import { GenerationsModule } from "./generations/generations.module.js";
import { CreditsModule } from "./credits/credits.module.js";
import { VideoModule } from "./video/video.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { validateEnvironment } from "./config/env.validation.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: (Number(configService.get<string>("RATE_LIMIT_TTL")) || 60) * 1000,
            limit: Number(configService.get<string>("RATE_LIMIT_LIMIT")) || 5,
          },
        ],
        errorMessage: "Too many attempts. Please try again in 15 minutes.",
      }),
    }),
    PrismaModule,
    AuthModule,
    MailModule,
    CreditsModule,
    GenerationsModule,
    VideoModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
