import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("MAIL_HOST");
    const port = this.configService.get<string>("MAIL_PORT");
    const user = this.configService.get<string>("MAIL_USERNAME");
    const pass = this.configService.get<string>("MAIL_PASSWORD");

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log("Mail transporter initialized");
    } else {
      this.logger.warn("Mail configuration incomplete — emails will be logged only");
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const fromAddress =
      this.configService.get<string>("MAIL_FROM_ADDRESS") || "noreply@omnisstudio.com";
    const fromName = this.configService.get<string>("MAIL_FROM_NAME") || "OmnisStudio";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; padding: 24px 0;">
          <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #7c3aed; line-height: 48px; text-align: center; color: #fff; font-size: 20px; font-weight: bold;">O</div>
        </div>
        <h1 style="font-size: 22px; color: #1a1a2e; text-align: center;">Verify your email</h1>
        <p style="font-size: 14px; color: #6b7280; text-align: center;">Use the code below to complete your registration.</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">This code expires in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: email,
        subject: "Verify your email — OmnisStudio",
        html,
      });
      this.logger.log(`Verification code sent to ${email}`);
    } else {
      this.logger.warn(`[DEV] Verification code for ${email}: ${code}`);
    }
  }
}
