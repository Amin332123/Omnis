import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreatePlanDto } from "./dto/create-plan.dto.js";
import { UpdatePlanDto } from "./dto/update-plan.dto.js";

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

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
