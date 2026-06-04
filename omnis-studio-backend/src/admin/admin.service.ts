import { Injectable, Logger, OnModuleInit, BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service.js";
import { UpdateUserCreditsDto } from "./dto/update-user-credits.dto.js";
import { UpdateUserPasswordDto } from "./dto/update-user-password.dto.js";

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const adminEmail = this.configService.get<string>("ADMIN_EMAIL");
    const adminPassword = this.configService.get<string>("ADMIN_PASSWORD");

    if (!adminEmail || !adminPassword) {
      this.logger.log("Admin bootstrap skipped (ADMIN_EMAIL/ADMIN_PASSWORD not configured)");
      return;
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });

    if (existing) {
      this.logger.log(`Admin user already exists: ${adminEmail}`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await this.prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        // Give admins plenty of credits by default so the UI is usable immediately
        credits: 1000,
      },
      select: { id: true, email: true, credits: true },
    });

    this.logger.log(`Admin user created: ${adminEmail}`);
  }

  async getStats() {
    const [totalUsers, creditsTotal, totalCreditsUsed, totalGenerations] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.aggregate({ _sum: { credits: true } }),
      this.prisma.generationJob.aggregate({ _sum: { creditsUsed: true } }),
      this.prisma.generationJob.count(),
    ]);

    const creditsTotalValue = creditsTotal._sum.credits ?? 0;
    const creditsUsedValue = totalCreditsUsed._sum.creditsUsed ?? 0;

    return {
      totalUsers,
      creditsTotal: creditsTotalValue,
      totalCreditsUsed: creditsUsedValue,
      totalGenerations,
    };
  }

  async listUsers(page: number, pageSize: number, query?: string) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(Math.max(1, pageSize), 100);

    const where =
      query && query.trim().length > 0
        ? {
            email: {
              contains: query.trim(),
              mode: "insensitive",
            },
          }
        : undefined;

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where: where as never }),
      this.prisma.user.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        select: {
          id: true,
          email: true,
          credits: true,
          createdAt: true,
          _count: {
            select: { jobs: true },
          },
        },
      }),
    ]);

    return {
      page: safePage,
      pageSize: safePageSize,
      total,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        credits: u.credits,
        createdAt: u.createdAt.toISOString(),
        generationCount: (u as { _count: { jobs: number } })._count.jobs,
      })),
    };
  }

  async updateUserCredits(userId: string, dto: UpdateUserCreditsDto) {
    if (dto.credits < 0) {
      throw new BadRequestException("credits must be >= 0");
    }

    const updated = await this.prisma.user.updateMany({
      where: { id: userId },
      data: { credits: dto.credits as unknown as number },
    });

    if (updated.count === 0) {
      throw new NotFoundException("User not found");
    }

    return { success: true };
  }

  async deleteUser(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("User not found");
    }

    // Note: If your DB has FK constraints, Prisma may require cascade behavior.
    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }

  async updateUserPassword(userId: string, dto: UpdateUserPasswordDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.updateMany({
      where: { id: userId },
      data: { passwordHash },
    });

    if (updated.count === 0) {
      throw new NotFoundException("User not found");
    }

    return { success: true };
  }

  async getCreditUsageSeries(days: number) {
    const safeDays = Math.min(Math.max(1, days), 60);
    const since = new Date();
    since.setDate(since.getDate() - safeDays);

    const jobs = await this.prisma.generationJob.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, creditsUsed: true },
      orderBy: { createdAt: "asc" },
    });

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);

    const buckets = new Map<string, number>();
    for (const job of jobs) {
      const key = dayKey(new Date(job.createdAt));
      buckets.set(key, (buckets.get(key) ?? 0) + job.creditsUsed);
    }

    const result = [];
    for (let i = safeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      result.push({ date: key, creditsUsed: buckets.get(key) ?? 0 });
    }

    return result;
  }

  async getNewUsersSeries(days: number) {
    const safeDays = Math.min(Math.max(1, days), 60);
    const since = new Date();
    since.setDate(since.getDate() - safeDays);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);

    const buckets = new Map<string, number>();
    for (const user of users) {
      const key = dayKey(new Date(user.createdAt));
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const result = [];
    for (let i = safeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      result.push({ date: key, newUsers: buckets.get(key) ?? 0 });
    }

    return result;
  }
}
