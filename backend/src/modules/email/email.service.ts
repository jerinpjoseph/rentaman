import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private fromAddress: string;
  private frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('SMTP_FROM', 'RentAMan <noreply@rentaman.com>');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Email transporter configured');
    } else {
      this.logger.warn('SMTP not configured - emails will be logged only');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[Email Preview] To: ${to}, Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/verify-email?token=${token}`;
    await this.send(email, 'Verify your RentAMan account', `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#6366f1">Welcome to RentAMan!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Verify Email</a>
        <p style="color:#666;font-size:14px">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const link = `${this.frontendUrl}/reset-password?token=${token}`;
    await this.send(email, 'Reset your RentAMan password', `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#6366f1">Password Reset</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
        <p style="color:#666;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `);
  }

  async sendBookingStatusUpdate(email: string, title: string, status: string) {
    const statusMessages: Record<string, string> = {
      ACCEPTED: 'Your booking has been accepted by the worker.',
      IN_PROGRESS: 'Your booking is now in progress.',
      COMPLETED: 'Your booking has been completed. Please leave a review!',
      CANCELLED: 'Your booking has been cancelled.',
    };

    await this.send(email, `Booking Update: ${title} - RentAMan`, `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#6366f1">Booking Update</h2>
        <p><strong>${title}</strong></p>
        <p>${statusMessages[status] || `Status changed to ${status}`}</p>
        <a href="${this.frontendUrl}/dashboard" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">View Dashboard</a>
      </div>
    `);
  }
}
