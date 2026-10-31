import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { MailService } from './mail.service';
import { PrismaService } from './prisma.service';

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;

type PublicUser = {
  id: string;
  email: string;
  status: string;
  profile: {
    nickname: string | null;
    school: string | null;
    grade: string | null;
    city: string | null;
    bio: string | null;
    interests: string[];
    relationshipGoal: string | null;
    personalityTags: string[];
    languages: string[];
    availableTimes: string[];
    communicationStyle: string | null;
    profileCompletedAt: Date | null;
  } | null;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}

  async sendEmailCode(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const recent = await this.prisma.emailVerificationCode.findFirst({ where: { email: normalizedEmail, createdAt: { gt: new Date(Date.now() - 60_000) } } });
    if (recent) throw new BadRequestException('验证码发送过于频繁，请稍后再试');
    if (await this.prisma.user.findUnique({ where: { email: normalizedEmail } })) throw new BadRequestException('该邮箱已经注册');
    const code = randomInt(100000, 1000000).toString();
    await this.mail.sendVerificationCode(normalizedEmail, code);
    await this.prisma.emailVerificationCode.create({ data: { email: normalizedEmail, codeHash: this.hashVerificationCode(normalizedEmail, code), expiresAt: new Date(Date.now() + 10 * 60_000) } });
    return { message: '验证码已发送' };
  }

  async register(email: string, password: string, nickname?: string, verificationCode?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!verificationCode) throw new BadRequestException('请输入邮箱验证码');
    const record = await this.prisma.emailVerificationCode.findFirst({ where: { email: normalizedEmail, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!record || record.codeHash !== this.hashVerificationCode(normalizedEmail, verificationCode)) throw new BadRequestException('验证码错误或已过期');
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new BadRequestException('该邮箱已经注册');

    const passwordHash = await this.hashPassword(password);
    const user = await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      return tx.user.create({ data: { email: normalizedEmail, emailVerifiedAt: new Date(), passwordHash, profile: { create: { nickname: nickname?.trim() || null } } }, include: { profile: true } });
    });

    return { user: this.publicUser(user), token: await this.createSession(user.id) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: { profile: true } });
    if (!user || user.status !== 'ACTIVE' || !(await this.verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return { user: this.publicUser(user), token: await this.createSession(user.id) };
  }

  async getUserFromToken(token: string) {
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.session.findUnique({ where: { tokenHash }, include: { user: { include: { profile: true } } } });
    if (!session || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('登录已失效');
    }
    return this.publicUser(session.user);
  }

  async updateProfile(userId: string, data: { nickname?: string; school?: string; grade?: string; city?: string; bio?: string; interests?: string[]; relationshipGoal?: string; personalityTags?: string[]; languages?: string[]; availableTimes?: string[]; communicationStyle?: string }) {
    const normalized = {
      ...data,
      nickname: data.nickname?.trim(),
      school: data.school?.trim(),
      grade: data.grade?.trim(),
      city: data.city?.trim(),
      bio: data.bio?.trim(),
      relationshipGoal: data.relationshipGoal?.trim(),
      interests: this.normalizeList(data.interests),
      personalityTags: this.normalizeList(data.personalityTags),
      languages: this.normalizeList(data.languages),
      availableTimes: this.normalizeList(data.availableTimes),
    };
    const current = await this.prisma.userProfile.findUnique({ where: { userId } });
    const merged = { ...current, ...normalized };
    const complete = Boolean(merged.nickname && merged.bio && merged.relationshipGoal && (merged.interests?.length || 0) >= 3 && merged.communicationStyle);
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...normalized, profileCompletedAt: complete ? new Date() : null },
      update: { ...normalized, profileCompletedAt: complete ? current?.profileCompletedAt || new Date() : null },
    });
  }

  async deleteAccount(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const activeHook = await tx.hook.findFirst({ where: { authorId: userId, status: { in: ['ASSIGNED', 'ANSWERED'] } }, select: { id: true } });
      if (activeHook) throw new BadRequestException('还有正在进行的 Hook，请先处理完成后再注销账号');
      await tx.session.deleteMany({ where: { userId } });
      await tx.receiverPreference.updateMany({ where: { userId, effectiveUntil: null }, data: { effectiveUntil: new Date() } });
      await tx.user.update({ where: { id: userId }, data: { status: 'DELETED' } });
      return { deleted: true };
    });
  }

  private normalizeList(values?: string[]) {
    if (!values) return undefined;
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private async createSession(userId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({ data: { userId, tokenHash: this.hashToken(token), expiresAt } });
    return token;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string) {
    const [salt, keyHex] = stored.split(':');
    if (!salt || !keyHex) return false;
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedKey = Buffer.from(keyHex, 'hex');
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  }

  private hashVerificationCode(email: string, code: string) {
    return createHash('sha256').update(`${email}:${code}`).digest('hex');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicUser(user: any): PublicUser {
    return { id: user.id, email: user.email, status: user.status, profile: user.profile };
  }
}
