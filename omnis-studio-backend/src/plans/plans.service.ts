import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreatePlanDto } from "./dto/create-plan.dto.js";
import { UpdatePlanDto } from "./dto/update-plan.dto.js";

const DEFAULT_PLANS = [
  {
    name: "Starter Pack",
    credits: 100,
    price: 29,
    features: [
      "~200 images (Schnell) or ~80 images (GPT Mini)",
      "~6 five-second videos",
      "Access to all models & quality tiers",
    ],
    popular: false,
    active: true,
  },
  {
    name: "Pro Pack",
    credits: 350,
    price: 79,
    features: [
      "~700 images (Schnell) or ~290 images (Dev)",
      "~23 five-second videos or ~14 ten-second videos",
      "Access to all models & quality tiers",
    ],
    popular: true,
    active: true,
  },
  {
    name: "Pro Max Pack",
    credits: 800,
    price: 149,
    features: [
      "~1,600 images (Schnell) or ~660 images (Dev)",
      "~53 five-second videos or ~32 ten-second videos",
      "Access to all models & quality tiers",
    ],
    popular: false,
    active: true,
  },
]

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.plan.count();
    if (count > 0) {
      this.logger.log(`Plans already seeded (${count} found), skipping`);
      return;
    }

    for (const plan of DEFAULT_PLANS) {
      await this.prisma.plan.create({
        data: {
          name: plan.name,
          credits: plan.credits,
          price: plan.price,
          features: plan.features as never,
          popular: plan.popular,
          active: plan.active,
        },
      });
    }

    this.logger.log(`Seeded ${DEFAULT_PLANS.length} default plans`);
  }

  async create(dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        credits: dto.credits,
        price: dto.price,
        features: (dto.features ?? []) as never,
        popular: dto.popular ?? false,
        active: dto.active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.plan.findMany({
      orderBy: { price: "asc" },
    });
  }

  async findActive() {
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException("Plan not found");
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id);
    return this.prisma.plan.update({
      where: { id },
      data: dto as never,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.plan.delete({ where: { id } });
    return { success: true };
  }
}
