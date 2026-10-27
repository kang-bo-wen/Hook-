import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AssignmentStatus, HookStatus, PreferenceScope, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async run(hookId?: string) {
    const hooks = await this.prisma.hook.findMany({
      where: { ...(hookId ? { id: hookId } : {}), status: HookStatus.WAITING_MATCH, assignment: null },
      take: hookId ? 1 : 50,
      orderBy: { createdAt: 'asc' },
    });
    const results = [];
    for (const hook of hooks) {
      try { results.push(await this.assignOne(hook)); } catch (error) {
        if (error instanceof ConflictException) continue;
        throw error;
      }
    }
    if (hookId && results.length === 0) throw new NotFoundException('Hook 不存在、已关闭或已经分配');
    return { matched: results.length, assignments: results };
  }

  private async assignOne(hook: { id: string; authorId: string; category: string; preferredResponses: string[]; depthLevel: string | null }) {
    return this.prisma.$transaction(async (tx) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const candidates = await tx.receiverPreference.findMany({
        where: { scope: PreferenceScope.NEXT_HOOK, effectiveUntil: null, userId: { not: hook.authorId }, user: { status: 'ACTIVE' }, },
        include: { user: true }, orderBy: { createdAt: 'asc' },
      });
      const scored = [] as Array<{ userId: string; score: number; reason: string }>;
      for (const preference of candidates) {
        const receivedToday = await tx.hookAssignment.count({ where: { recipientId: preference.userId, assignedAt: { gte: today } } });
        if (receivedToday > 0 || preference.excludedTypes.includes(hook.category)) continue;
        let score = 0; const reasons: string[] = [];
        if (preference.topicTypes.includes(hook.category)) { score += 50; reasons.push('主题偏好匹配'); }
        const responseOverlap = hook.preferredResponses.filter((item) => preference.responseModes.includes(item)).length;
        if (responseOverlap > 0) { score += responseOverlap * 15; reasons.push('回应方式匹配'); }
        if (hook.depthLevel && hook.depthLevel === preference.depthLevel) { score += 20; reasons.push('内容深度匹配'); }
        score += Math.max(0, 10 - Math.floor((Date.now() - preference.createdAt.getTime()) / 86_400_000));
        scored.push({ userId: preference.userId, score, reason: reasons.join('、') || '符合基本接收条件' });
      }
      scored.sort((a, b) => b.score - a.score);
      const winner = scored[0];
      if (!winner) throw new ConflictException('暂无符合条件的接收者');
      const assignment = await tx.hookAssignment.create({ data: { hookId: hook.id, recipientId: winner.userId, score: winner.score, matchReason: winner.reason } });
      await tx.hook.update({ where: { id: hook.id }, data: { status: HookStatus.ASSIGNED } });
      await tx.receiverPreference.updateMany({ where: { userId: winner.userId, scope: PreferenceScope.NEXT_HOOK, effectiveUntil: null }, data: { effectiveUntil: new Date() } });
      return assignment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  received(userId: string) {
    return this.prisma.hookAssignment.findMany({ where: { recipientId: userId }, orderBy: { assignedAt: 'desc' }, include: { hook: { select: { id: true, title: true, content: true, category: true, preferredResponses: true, depthLevel: true, status: true, createdAt: true } }, reply: true } });
  }

  async markViewed(userId: string, assignmentId: string) {
    const assignment = await this.prisma.hookAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.recipientId !== userId) throw new NotFoundException('分配记录不存在');
    return this.prisma.hookAssignment.update({ where: { id: assignmentId }, data: { status: AssignmentStatus.VIEWED, viewedAt: new Date() } });
  }
}
