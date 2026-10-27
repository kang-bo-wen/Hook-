import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter = this.createTransporter();

  async sendVerificationCode(to: string, code: string) {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    if (!from || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new ServiceUnavailableException('SMTP 邮件服务尚未配置');
    }
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Hook 注册验证码',
        text: `你的 Hook 注册验证码是：${code}\n验证码 10 分钟内有效，请勿将它告诉别人。`,
        html: `<p>你的 Hook 注册验证码是：</p><h1 style="letter-spacing: 6px">${code}</h1><p>验证码 10 分钟内有效，请勿将它告诉别人。</p>`,
      });
    } catch (error) {
      console.error('SMTP verification email failed:', error instanceof Error ? error.message : error);
      throw new ServiceUnavailableException('验证码发送失败，请检查 SMTP 配置');
    }
  }

  private createTransporter() {
    const port = Number(process.env.SMTP_PORT || 465);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
}
