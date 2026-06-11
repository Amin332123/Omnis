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
      "~6 five-second videos",
      "Access to all models & quality tiers",
      "~200 images (Schnell) or ~80 images (GPT Mini)",
    ],
    popular: false,
    active: true,
    sortOrder: 1,
  },
  {
    name: "Pro Pack",
    credits: 350,
    price: 79,
    features: [
      "~23 five-second videos or ~14 ten-second videos",
      "Access to all models & quality tiers",
      "~700 images (Schnell) or ~290 images (Dev)",
    ],
    popular: true,
    active: true,
    sortOrder: 2,
  },
  {
    name: "Pro Max Pack",
    credits: 800,
    price: 149,
    features: [
      "~53 five-second videos or ~32 ten-second videos",
      "Access to all models & quality tiers",
      "~1,600 images (Schnell) or ~660 images (Dev)",
    ],
    popular: false,
    active: true,
    sortOrder: 3,
  },
]

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);
  private cache: { data: unknown; expiry: number } = { data: null, expiry: 0 };
  private readonly CACHE_TTL = 5 * 60 * 1000;

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
          sortOrder: plan.sortOrder,
        },
      });
    }

    this.logger.log(`Seeded ${DEFAULT_PLANS.length} default plans`);
  }

  async create(dto: CreatePlanDto) {
    this.clearCache();
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        credits: dto.credits,
        price: dto.price,
        features: (dto.features ?? []) as never,
        popular: dto.popular ?? false,
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll() {
    return this.prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
  }

  async findActive() {
    if (this.cache.data && Date.now() < this.cache.expiry) {
      return this.cache.data;
    }
    const data = await this.prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
    this.cache = { data, expiry: Date.now() + this.CACHE_TTL };
    return data;
  }

  private clearCache() {
    this.cache = { data: null, expiry: 0 };
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException("Plan not found");
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto) {
    this.clearCache();
    await this.findOne(id);
    return this.prisma.plan.update({
      where: { id },
      data: dto as never,
    });
  }

  async remove(id: string) {
    this.clearCache();
    await this.findOne(id);
    await this.prisma.plan.delete({ where: { id } });
    return { success: true };
  }
}
