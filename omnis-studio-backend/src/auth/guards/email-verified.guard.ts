import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{
      user?: { isEmailVerified?: boolean };
    }>();

    if (!req.user?.isEmailVerified) {
      throw new ForbiddenException("Please verify your email before accessing this resource.");
    }

    return true;
  }
}
