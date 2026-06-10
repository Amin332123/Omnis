import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import { Prisma } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { MailService } from "../mail/mail.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import { SendVerificationCodeDto } from "./dto/send-verification-code.dto.js";
import { VerifyCodeDto } from "./dto/verify-code.dto.js";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto.js";
import { ResetPasswordDto } from "./dto/reset-password.dto.js";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    let user: { id: string; email: string; credits: number };

    try {
      user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          credits: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email already exists");
      }

      throw error;
    }

    await this.sendEmailVerificationLink(user.id).catch((err) => {
      this.logger.warn(`Failed to send verification email to ${user.email}: ${(err as Error).message}`);
    });

    return user;
  }

  async sendVerificationCode(dto: SendVerificationCodeDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, deletedAt: true },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException("Email already exists");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.verificationCode.deleteMany({
      where: { email: dto.email, used: false },
    });

    await this.prisma.verificationCode.create({
      data: {
        email: dto.email,
        code,
        passwordHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await this.mailService.sendVerificationCode(dto.email, code);
    } catch {
      this.logger.warn(`Email failed, but code ${code} is stored for ${dto.email}`);
    }

    return { success: true };
  }

  async verifyAndRegister(dto: VerifyCodeDto) {
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        email: dto.email,
        code: dto.code,
        used: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    });

    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true, deletedAt: true },
      });

      let userId: string;

      if (existing && existing.deletedAt) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash: record.passwordHash,
            deletedAt: null,
            credits: 5,
            emailNotifications: true,
            marketingEmails: false,
            avatarUrl: null,
            isEmailVerified: true,
          },
        });
        userId = existing.id;
      } else {
        const user = await this.prisma.user.create({
          data: {
            email: dto.email,
            passwordHash: record.passwordHash,
            isEmailVerified: true,
          },
          select: { id: true },
        });
        userId = user.id;
      }

      const payload = { sub: userId, email: dto.email };
      const accessToken = await this.jwtService.signAsync(payload);

      return { accessToken };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email already exists");
      }
      throw error;
    }
  }

  async sendEmailVerificationLink(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isEmailVerified: true },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.isEmailVerified) {
      throw new BadRequestException("Email is already verified.");
    }

    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, used: false },
    });

    const token = randomBytes(32).toString("hex");

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    try {
      await this.mailService.sendEmailVerificationLink(user.email, verificationLink);
    } catch {
      this.logger.warn(`Email verification link sending failed for ${user.email}. Link: ${verificationLink}`);
    }

    return { success: true };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record || record.used) {
      throw new BadRequestException("Invalid or expired verification token.");
    }

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException("Verification token has expired.");
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
    ]);

    return { success: true };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return { success: true };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const placeholderHash = await bcrypt.hash(`password-reset:${dto.email}:${code}`, 10);

    await this.prisma.verificationCode.deleteMany({
      where: { email: dto.email, used: false },
    });

    await this.prisma.verificationCode.create({
      data: {
        email: dto.email,
        code,
        passwordHash: placeholderHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await this.mailService.sendPasswordResetCode(dto.email, code);
    } catch {
      throw new InternalServerErrorException("Failed to send password reset email");
    }

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        email: dto.email,
        code: dto.code,
        used: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException("Invalid or expired reset code");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new BadRequestException("Invalid or expired reset code");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    return { success: true };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        deletedAt: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.deletedAt) {
      throw new UnauthorizedException(
        "This account has been deleted. Please contact support if you'd like to recover it.",
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const adminEmail = this.configService.get<string>("ADMIN_EMAIL");
    const isAdmin = !!adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase();

    if (!user.isEmailVerified && !isAdmin) {
      throw new ForbiddenException({
        message: "Please verify your email before logging in.",
        resend_verification: true,
      });
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async updateNotifications(userId: string, prefs: { emailNotifications?: boolean; marketingEmails?: boolean }) {
    const data: Record<string, boolean> = {};
    if (prefs.emailNotifications !== undefined) data.emailNotifications = prefs.emailNotifications;
    if (prefs.marketingEmails !== undefined) data.marketingEmails = prefs.marketingEmails;

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return { success: true };
  }

  async uploadAvatar(userId: string, file: { originalname: string; buffer: Buffer }, baseUrl: string) {
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = file.originalname.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? "jpg";
    const filename = `avatar-${userId}.${ext}`;
    const filepath = join(uploadDir, filename);

    const oldUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (oldUser?.avatarUrl) {
      const oldFilename = oldUser.avatarUrl.split("/").pop();
      if (oldFilename) {
        const oldPath = join(uploadDir, oldFilename);
        if (existsSync(oldPath)) {
          await unlink(oldPath).catch(() => {});
        }
      }
    }

    await writeFile(filepath, file.buffer);

    const avatarUrl = `${baseUrl}/uploads/avatars/${filename}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }

  async softDeleteAccount(userId: string, baseUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
      const oldFilename = user.avatarUrl.split("/").pop();
      if (oldFilename) {
        const oldPath = join(uploadDir, oldFilename);
        if (existsSync(oldPath)) {
          await unlink(oldPath).catch(() => {});
        }
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), avatarUrl: null },
    });

    return { success: true };
  }
}
