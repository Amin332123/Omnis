import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const RESEND_API_URL = "https://api.resend.com/emails";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string | null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("RESEND_API_KEY") ?? null;
    if (this.apiKey) {
      this.logger.log("Resend API mailer initialized");
    } else {
      this.logger.warn("RESEND_API_KEY not set — emails will be logged only");
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.sendCodeEmail({
      email,
      code,
      subject: "Verify your email — OmnisStudio",
      title: "Verify your email",
      intro: "Use the code below to complete your registration.",
      footer: "If you did not request this, please ignore this email.",
      logLabel: "Verification code",
    });
  }

  async sendEmailVerificationLink(email: string, link: string): Promise<void> {
    const fromAddress =
      this.configService.get<string>("MAIL_FROM_ADDRESS") || "noreply@omnis-studio.com";
    const fromName = this.configService.get<string>("MAIL_FROM_NAME") || "Omnis studio";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; padding: 24px 0;">
          <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #7c3aed; line-height: 48px; text-align: center; color: #fff; font-size: 20px; font-weight: bold;">O</div>
        </div>
        <h1 style="font-size: 22px; color: #1a1a2e; text-align: center;">Verify your email</h1>
        <p style="font-size: 14px; color: #6b7280; text-align: center;">Click the button below to verify your email address and get started.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="display: inline-block; background: #7c3aed; color: #fff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 10px;">Verify email</a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `;

    if (!this.apiKey) {
      this.logger.warn(`[FALLBACK] Verification link for ${email}: ${link}`);
      return;
    }

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `"${fromName}" <${fromAddress}>`,
          to: email,
          subject: "Verify your email — OmnisStudio",
          html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown");
        throw new Error(`Resend API returned ${response.status}: ${errorBody}`);
      }

      this.logger.log(`Verification link sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification link to ${email}: ${(error as Error).message}`);
      this.logger.warn(`[FALLBACK] Verification link for ${email}: ${link}`);
      throw error;
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    await this.sendCodeEmail({
      email,
      code,
      subject: "Reset your password — OmnisStudio",
      title: "Reset your password",
      intro: "Use the code below to set a new password for your account.",
      footer: "If you did not request a password reset, you can safely ignore this email.",
      logLabel: "Password reset code",
    });
  }

  private async sendCodeEmail({
    email,
    code,
    subject,
    title,
    intro,
    footer,
    logLabel,
  }: {
    email: string;
    code: string;
    subject: string;
    title: string;
    intro: string;
    footer: string;
    logLabel: string;
  }): Promise<void> {
    const fromAddress =
      this.configService.get<string>("MAIL_FROM_ADDRESS") || "noreply@omnis-studio.com";
    const fromName = this.configService.get<string>("MAIL_FROM_NAME") || "Omnis studio";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; padding: 24px 0;">
          <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #7c3aed; line-height: 48px; text-align: center; color: #fff; font-size: 20px; font-weight: bold;">O</div>
        </div>
        <h1 style="font-size: 22px; color: #1a1a2e; text-align: center;">${title}</h1>
        <p style="font-size: 14px; color: #6b7280; text-align: center;">${intro}</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">This code expires in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">${footer}</p>
      </div>
    `;

    if (!this.apiKey) {
      this.logger.warn(`[FALLBACK] ${logLabel} for ${email}: ${code}`);
      return;
    }

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `"${fromName}" <${fromAddress}>`,
          to: email,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown");
        throw new Error(`Resend API returned ${response.status}: ${errorBody}`);
      }

      this.logger.log(`${logLabel} sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${(error as Error).message}`);
      this.logger.warn(`[FALLBACK] ${logLabel} for ${email}: ${code}`);
      throw error;
    }
  }
}
