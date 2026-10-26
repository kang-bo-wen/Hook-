import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from './prisma.service';

const TOKEN_TTL_SECONDS = 8 * 60 * 60;
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  login(username: string, password: string) {
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const secret = process.env.ADMIN_TOKEN_SECRET;
    if (!expectedUser || !expectedPassword || !secret) throw new ServiceUnavailableException('管理员账号尚未配置');
    if (!this.safeEqual(username, expectedUser) || !this.safeEqual(password, expectedPassword)) throw new UnauthorizedException('账号或密码错误');
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payload = `${expiresAt}.${randomBytes(16).toString('hex')}`;
    return { token: `${payload}.${this.sign(payload, secret)}`, expiresAt };
  }

  authorize(header?: string) {
    const secret = process.env.ADMIN_TOKEN_SECRET;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!secret || !token) throw new UnauthorizedException('管理员未登录');
    const parts = token.split('.');
    if (parts.length !== 3 || !/^\d+$/.test(parts[0])) throw new UnauthorizedException('管理员登录已失效');
    const payload = `${parts[0]}.${parts[1]}`;
    if (Number(parts[0]) <= Math.floor(Date.now() / 1000) || !this.safeEqual(parts[2], this.sign(payload, secret))) throw new UnauthorizedException('管理员登录已失效');
  }

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, take: 200,
      select: { id: true, email: true, emailVerifiedAt: true, status: true, createdAt: true, profile: { select: { nickname: true, school: true, grade: true, city: true } }, _count: { select: { hooks: true } } },
    });
  }

  listHooks() {
    return this.prisma.hook.findMany({
      orderBy: { createdAt: 'desc' }, take: 200,
      select: { id: true, title: true, content: true, category: true, status: true, createdAt: true, author: { select: { id: true, email: true, profile: { select: { nickname: true } } } }, assignment: { select: { recipient: { select: { id: true, email: true } }, status: true } } },
    });
  }

  private sign(value: string, secret: string) { return createHmac('sha256', secret).update(value).digest('hex'); }
  private safeEqual(a: string, b: string) {
    const x = Buffer.from(a); const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  }
}
