import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller.js";
import { AdminService } from "./admin.service.js";
import { AdminGuard } from "./guards/admin.guard.js";
import { PlansModule } from "../plans/plans.module.js";

@Module({
  imports: [PlansModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
