import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { Throttle, minutes, hours } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { Request } from "express";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import { SendVerificationCodeDto } from "./dto/send-verification-code.dto.js";
import { VerifyCodeDto } from "./dto/verify-code.dto.js";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto.js";
import { ResetPasswordDto } from "./dto/reset-password.dto.js";

const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB

type AuthenticatedUser = {
  id: string;
  email: string;
  credits: number;
  avatarUrl: string | null;
  emailNotifications: boolean;
  marketingEmails: boolean;
  createdAt: Date;
  isAdmin?: boolean;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 10, ttl: hours(1) } })
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: "User registered successfully.",
    schema: {
      example: {
        id: "9f6bbad0-2c60-4f1e-84ae-b3f51e4e6a3a",
        email: "user@example.com",
        credits: 5,
      },
    },
  })
  @ApiConflictResponse({ description: "Email already exists" })
  @ApiBadRequestResponse({ description: "Validation errors" })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("send-verification-code")
  @Throttle({ default: { limit: 3, ttl: hours(1) } })
  @HttpCode(200)
  @ApiOperation({ summary: "Send a verification code to the email" })
  @ApiBody({ type: SendVerificationCodeDto })
  @ApiOkResponse({ description: "Code sent successfully." })
  @ApiConflictResponse({ description: "Email already exists" })
  @ApiBadRequestResponse({ description: "Validation errors" })
  sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post("verify-and-register")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify code and create account" })
  @ApiBody({ type: VerifyCodeDto })
  @ApiOkResponse({
    description: "Account created. Returns JWT.",
    schema: {
      example: { accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid or expired code" })
  verifyAndRegister(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyAndRegister(dto);
  }

  @Post("request-password-reset")
  @Throttle({ default: { limit: 3, ttl: hours(1) } })
  @HttpCode(200)
  @ApiOperation({ summary: "Send a password reset code if the account exists" })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiOkResponse({ description: "Password reset request accepted." })
  @ApiBadRequestResponse({ description: "Validation errors" })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post("reset-password")
  @HttpCode(200)
  @ApiOperation({ summary: "Reset password using a verification code" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ description: "Password reset successfully." })
  @ApiBadRequestResponse({ description: "Invalid or expired reset code" })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: minutes(15) } })
  @HttpCode(200)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: "Login successful.",
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Invalid email or password" })
  @ApiBadRequestResponse({ description: "Validation errors" })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload profile avatar" })
  @ApiOkResponse({ description: "Avatar uploaded successfully." })
  @ApiBadRequestResponse({ description: "Invalid file" })
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: AVATAR_MAX_SIZE }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: { originalname: string; mimetype: string; buffer: Buffer; size: number },
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return this.authService.uploadAvatar(req.user.id, file, baseUrl);
  }

  @Get("notifications")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get notification preferences" })
  @ApiOkResponse({ description: "Notification preferences." })
  getNotifications(@Req() req: Request & { user: AuthenticatedUser }) {
    return {
      emailNotifications: req.user.emailNotifications,
      marketingEmails: req.user.marketingEmails,
    };
  }

  @Patch("notifications")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update notification preferences" })
  @ApiOkResponse({ description: "Preferences updated." })
  async updateNotifications(
    @Body() body: { emailNotifications?: boolean; marketingEmails?: boolean },
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.authService.updateNotifications(req.user.id, body);
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Soft delete own account" })
  @ApiOkResponse({ description: "Account deleted successfully." })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  async deleteAccount(@Req() req: Request & { user: AuthenticatedUser }) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return this.authService.softDeleteAccount(req.user.id, baseUrl);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiOkResponse({
    description: "Authenticated user profile.",
    schema: {
      example: {
        id: "9f6bbad0-2c60-4f1e-84ae-b3f51e4e6a3a",
        email: "user@example.com",
        credits: 5,
        createdAt: "2026-06-01T16:40:12.123Z",
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  me(@Req() req: Request & { user: AuthenticatedUser & { avatarUrl?: string | null } }) {
    const user = req.user;
    if (user.avatarUrl && user.avatarUrl.startsWith("/")) {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      user.avatarUrl = `${baseUrl}${user.avatarUrl}`;
    }
    return user;
  }
}
