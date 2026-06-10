import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service.js";

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET is required to start the server");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        credits: true,
        avatarUrl: true,
        emailNotifications: true,
        marketingEmails: true,
        isEmailVerified: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.deletedAt) {
      throw new UnauthorizedException(
        "This account has been deleted.",
      );
    }

    const adminEmail = this.configService.get<string>("ADMIN_EMAIL");
    const isAdmin = !!adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase();

    return {
      ...user,
      isAdmin,
    };
  }
}
