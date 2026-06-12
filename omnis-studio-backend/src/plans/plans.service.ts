import { Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreatePlanDto } from "./dto/create-plan.dto.js";
import { UpdatePlanDto } from "./dto/update-plan.dto.js";

const DEFAULT_PLANS = [
  {
    name: "Starter Pack",
    credits: 300,
    price: 29,
    paddlePriceId: "pro_01kty756pz1wm7zg07c6spvsw5",
    features: [
      "300 credits to use anytime",
      "Credits never expire",
      "Generate images & videos",
    ],
    popular: false,
    active: true,
    sortOrder: 1,
  },
  {
    name: "Pro Pack",
    credits: 1000,
    price: 79,
    paddlePriceId: "pro_01kty78aq24p6ed4r6znchr9t7",
    features: [
      "1000 credits to use anytime",
      "Credits never expire",
      "Generate images & videos",
      "Most popular choice",
    ],
    popular: true,
    active: true,
    sortOrder: 2,
  },
  {
    name: "Pro Max Pack",
    credits: 2000,
    price: 149,
    paddlePriceId: "pro_01kty7m4ykc0hzrc2q1m1bcc81",
    features: [
      "2000 credits to use anytime",
      "Credits never expire",
      "Generate images & videos",
      "Best value per credit",
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
          paddlePriceId: plan.paddlePriceId,
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
        paddlePriceId: dto.paddlePriceId,
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
