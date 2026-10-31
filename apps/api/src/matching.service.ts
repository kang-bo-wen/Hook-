import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentStatus, HookStatus, PreferenceScope, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const DAY_MS = 86_400_000;
const ASSIGNMENT_TTL_MS = 48 * 60 * 60 * 1000;
const PAIR_COOLDOWN_DAYS = Number(process.env.MATCH_PAIR_COOLDOWN_DAYS ?? (process.env.NODE_ENV === 'production' ? 30 : 0));
const ACTIVE_ASSIGNMENT_STATUSES: AssignmentStatus[] = [AssignmentStatus.ASSIGNED, AssignmentStatus.VIEWED];

type MatchableHook = {
  id: string;
  authorId: string;
  category: string;
  preferredResponses: string[];
  excludedResponses: string[];
  depthLevel: string | null;
  createdAt: Date;
  author: { profile: { interests: string[]; city: string | null; communicationStyle: string | null } | null };
};

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async run(hookId?: string) {
    await this.expireAssignments();
    const hooks = await this.prisma.hook.findMany({
      where: { ...(hookId ? { id: hookId } : {}), status: HookStatus.WAITING_MATCH, assignment: null },
      include: { author: { select: { profile: { select: { interests: true, city: true, communicationStyle: true } } } } },
      take: hookId ? 1 : 50,
      orderBy: { createdAt: 'asc' },
    });
    const results = [];
    for (const hook of hooks) {
      const assignment = await this.assignOne(hook);
      if (assignment) results.push(assignment);
    }
    if (hookId && hooks.length === 0) throw new NotFoundException('Hook 不存在、已关闭或已经分配');
    if (hookId && results.length === 0) throw new ConflictException('当前暂无合适的接收者，Hook 会继续等待');
    return { matched: results.length, assignments: results };
  }

  async expireAssignments() {
    const expired = await this.prisma.hookAssignment.findMany({
      where: { status: { in: ACTIVE_ASSIGNMENT_STATUSES }, expiresAt: { lte: new Date() } },
      select: { id: true, hookId: true, recipientId: true },
      take: 100,
    });
    for (const assignment of expired) {
      await this.releaseAssignment(assignment.id, AssignmentStatus.EXPIRED, '接收者未在 48 小时内处理');
    }
    return { expired: expired.length };
  }

  async decline(userId: string, assignmentId: string) {
    const assignment = await this.prisma.hookAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.recipientId !== userId) throw new NotFoundException('分配记录不存在');
    if (!ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status)) throw new BadRequestException('该 Hook 已经处理，不能再次拒绝');
    await this.releaseAssignment(assignmentId, AssignmentStatus.DECLINED, '接收者主动拒绝');
    return { declined: true, hookId: assignment.hookId };
  }

  private async releaseAssignment(assignmentId: string, status: AssignmentStatus, reason: string) {
    await this.prisma.$transaction(async (tx) => {
      const assignment = await tx.hookAssignment.findUnique({ where: { id: assignmentId } });
      if (!assignment || !ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status)) return;
      await tx.matchLog.create({ data: { hookId: assignment.hookId, recipientId: assignment.recipientId, event: status === AssignmentStatus.EXPIRED ? 'ASSIGNMENT_EXPIRED' : 'ASSIGNMENT_DECLINED', score: assignment.score, reason } });
      await tx.hookAssignment.delete({ where: { id: assignmentId } });
      await tx.hook.update({ where: { id: assignment.hookId }, data: { status: HookStatus.WAITING_MATCH } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async assignOne(hook: MatchableHook) {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const repeatCutoff = new Date(now.getTime() - PAIR_COOLDOWN_DAYS * DAY_MS);
      const preferences = await tx.receiverPreference.findMany({
        where: {
          scope: { in: [PreferenceScope.NEXT_HOOK, PreferenceScope.LONG_TERM] }, effectiveUntil: null,
          userId: { not: hook.authorId },
          user: { status: 'ACTIVE', emailVerifiedAt: { not: null }, profile: { is: { profileCompletedAt: { not: null } } } },
        },
        include: { user: { select: { id: true, createdAt: true, profile: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const preferenceByUser = new Map<string, typeof preferences[number]>();
      for (const preference of preferences) {
        const existing = preferenceByUser.get(preference.userId);
        if (!existing || preference.scope === PreferenceScope.NEXT_HOOK) preferenceByUser.set(preference.userId, preference);
      }

      let excluded = 0;
      const scored: Array<{ userId: string; score: number; reason: string }> = [];
      for (const preference of preferenceByUser.values()) {
        const [activeAssignment, previousPair] = await Promise.all([
          tx.hookAssignment.findFirst({ where: { recipientId: preference.userId, status: { in: ACTIVE_ASSIGNMENT_STATUSES } }, select: { id: true } }),
          tx.matchLog.findFirst({ where: { hookId: hook.id, recipientId: preference.userId, event: { in: ['ASSIGNMENT_DECLINED', 'ASSIGNMENT_EXPIRED'] } }, select: { id: true } }),
        ]);
        const recentPair = PAIR_COOLDOWN_DAYS > 0
          ? await tx.hookAssignment.findFirst({ where: { recipientId: preference.userId, assignedAt: { gte: repeatCutoff }, hook: { authorId: hook.authorId } }, select: { id: true } })
          : null;
        if (activeAssignment || previousPair || recentPair || preference.excludedTypes.includes(hook.category) || hook.excludedResponses.some((mode) => preference.responseModes.includes(mode))) { excluded++; continue; }

        let score = 20; const reasons: string[] = ['符合基本接收条件'];
        if (preference.topicTypes.includes(hook.category)) { score += 40; reasons.push('主题符合你的偏好'); }
        const responseOverlap = hook.preferredResponses.filter((mode) => preference.responseModes.includes(mode)).length;
        if (responseOverlap > 0) { score += Math.min(20, responseOverlap * 10); reasons.push('回应方式合适'); }
        if (hook.depthLevel && preference.depthLevel) { if (hook.depthLevel === preference.depthLevel) { score += 20; reasons.push('交流深度一致'); } else score -= 8; }
        const profile = preference.user.profile;
        const interestOverlap = this.overlap(hook.author.profile?.interests || [], profile?.interests || []);
        if (interestOverlap > 0) { score += Math.min(15, interestOverlap * 5); reasons.push(`有 ${interestOverlap} 个共同兴趣`); }
        if (hook.author.profile?.city && profile?.city && hook.author.profile.city === profile.city) { score += 5; reasons.push('所在城市相同'); }
        if (hook.author.profile?.communicationStyle && profile?.communicationStyle && hook.author.profile.communicationStyle !== profile.communicationStyle) { score += 5; reasons.push('交流风格互补'); }
        const waitingDays = Math.floor((now.getTime() - preference.createdAt.getTime()) / DAY_MS);
        score += Math.min(15, waitingDays * 2) + Math.min(10, Math.floor((now.getTime() - preference.user.createdAt.getTime()) / (7 * DAY_MS))) + this.stableJitter(`${hook.id}:${preference.userId}`);
        if (score >= 25) scored.push({ userId: preference.userId, score: Math.round(score * 100) / 100, reason: reasons.slice(0, 4).join('、') || '符合基本接收条件' }); else excluded++;
      }

      scored.sort((a, b) => b.score - a.score || a.userId.localeCompare(b.userId));
      const winner = scored[0];
      await tx.matchLog.create({ data: { hookId: hook.id, event: winner ? 'MATCH_RUN' : 'MATCH_NO_CANDIDATE', recipientId: winner?.userId, score: winner?.score, reason: winner?.reason || '暂无达到门槛的候选人', details: { preferenceCount: preferenceByUser.size, eligibleCount: scored.length, excludedCount: excluded } } });
      if (!winner) return null;
      const assignment = await tx.hookAssignment.create({ data: { hookId: hook.id, recipientId: winner.userId, score: winner.score, matchReason: winner.reason, expiresAt: new Date(now.getTime() + ASSIGNMENT_TTL_MS) } });
      await tx.hook.update({ where: { id: hook.id }, data: { status: HookStatus.ASSIGNED } });
      await tx.receiverPreference.updateMany({ where: { userId: winner.userId, scope: PreferenceScope.NEXT_HOOK, effectiveUntil: null }, data: { effectiveUntil: now } });
      await tx.matchLog.create({ data: { hookId: hook.id, recipientId: winner.userId, event: 'ASSIGNED', score: winner.score, reason: winner.reason, details: { expiresAt: assignment.expiresAt.toISOString() } } });
      return assignment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private overlap(left: string[], right: string[]) {
    const normalized = new Set(left.map((value) => value.trim().toLowerCase()).filter(Boolean));
    return new Set(right.map((value) => value.trim().toLowerCase()).filter((value) => normalized.has(value))).size;
  }
  private stableJitter(value: string) { let hash = 0; for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0; return (hash % 500) / 100; }

  async received(userId: string) {
    await this.expireAssignments();
    return this.prisma.hookAssignment.findMany({ where: { recipientId: userId }, orderBy: { assignedAt: 'desc' }, include: { hook: { select: { id: true, title: true, content: true, category: true, moodTags: true, preferredResponses: true, depthLevel: true, allowPrivateChatRequest: true, revealNickname: true, revealProfileTags: true, status: true, createdAt: true, author: { select: { profile: { select: { nickname: true, interests: true, personalityTags: true } } } } } }, reply: true } });
  }

  async receivedDetail(userId: string, assignmentId: string) {
    await this.expireAssignments();
    const assignment = await this.prisma.hookAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        hook: {
          select: {
            id: true, title: true, content: true, category: true, moodTags: true, preferredResponses: true, depthLevel: true,
            allowPrivateChatRequest: true, revealNickname: true, revealProfileTags: true, status: true, createdAt: true,
            author: { select: { profile: { select: { nickname: true, bio: true, interests: true, personalityTags: true, faculty: true, major: true, campus: true, mbti: true, futurePlan: true, communicationStyle: true } } } },
          },
        },
        reply: true,
      },
    });
    if (!assignment || assignment.recipientId !== userId) throw new NotFoundException('分配记录不存在');
    const profile = assignment.hook.author.profile;
    assignment.hook.author.profile = profile ? {
      ...profile,
      nickname: assignment.hook.revealNickname ? profile.nickname : null,
      bio: assignment.hook.revealProfileTags ? profile.bio : null,
      interests: assignment.hook.revealProfileTags ? profile.interests : [],
      personalityTags: assignment.hook.revealProfileTags ? profile.personalityTags : [],
      faculty: assignment.hook.revealProfileTags ? profile.faculty : null,
      major: assignment.hook.revealProfileTags ? profile.major : null,
      campus: assignment.hook.revealProfileTags ? profile.campus : null,
      mbti: assignment.hook.revealProfileTags ? profile.mbti : null,
      futurePlan: assignment.hook.revealProfileTags ? profile.futurePlan : null,
      communicationStyle: assignment.hook.revealProfileTags ? profile.communicationStyle : null,
    } : null;
    return assignment;
  }

  async markViewed(userId: string, assignmentId: string) {
    const assignment = await this.prisma.hookAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.recipientId !== userId) throw new NotFoundException('分配记录不存在');
    if (assignment.expiresAt <= new Date()) { await this.releaseAssignment(assignment.id, AssignmentStatus.EXPIRED, '查看时已超过处理期限'); throw new BadRequestException('这个 Hook 已超时，已经重新进入匹配'); }
    if (assignment.status !== AssignmentStatus.ASSIGNED) return assignment;
    return this.prisma.hookAssignment.update({ where: { id: assignmentId }, data: { status: AssignmentStatus.VIEWED, viewedAt: new Date() } });
  }

  async reply(userId: string, assignmentId: string, content: string, wantsPrivateChat: boolean) {
    const assignment = await this.prisma.hookAssignment.findUnique({ where: { id: assignmentId }, select: { id: true, recipientId: true, expiresAt: true, hook: { select: { allowPrivateChatRequest: true } } } });
    if (!assignment || assignment.recipientId !== userId) throw new NotFoundException('分配记录不存在');
    if (wantsPrivateChat && !assignment.hook.allowPrivateChatRequest) throw new BadRequestException('发布者没有开放继续认识申请');
    if (assignment.expiresAt <= new Date()) {
      await this.releaseAssignment(assignment.id, AssignmentStatus.EXPIRED, '回应时已超过处理期限');
      throw new BadRequestException('这个 Hook 已超时，已经重新进入匹配');
    }
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.hookAssignment.findUnique({ where: { id: assignmentId }, include: { reply: { select: { id: true } } } });
      if (!current || current.recipientId !== userId) throw new NotFoundException('分配记录不存在');
      if (current.reply || current.status === AssignmentStatus.ANSWERED) throw new BadRequestException('这个 Hook 已经回应过了');
      if (!ACTIVE_ASSIGNMENT_STATUSES.includes(current.status)) throw new BadRequestException('该 Hook 当前不能回应');
      const now = new Date();
      if (current.expiresAt <= now) throw new BadRequestException('这个 Hook 已超时，无法回应');
      const reply = await tx.hookReply.create({ data: { hookId: current.hookId, assignmentId: current.id, recipientId: userId, content: content.trim(), wantsPrivateChat } });
      await tx.hookAssignment.update({ where: { id: current.id }, data: { status: AssignmentStatus.ANSWERED, respondedAt: now, viewedAt: current.viewedAt || now, closedAt: wantsPrivateChat ? null : now } });
      await tx.hook.update({ where: { id: current.hookId }, data: { status: HookStatus.ANSWERED } });
      await tx.matchLog.create({ data: { hookId: current.hookId, recipientId: userId, event: 'ASSIGNMENT_ANSWERED', score: current.score, reason: wantsPrivateChat ? '接收者已回应并期待私聊' : '接收者已提交一次回应' } });
      return reply;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async respondToReply(authorId: string, hookId: string, decision: 'ACCEPT' | 'DECLINE' | 'ACK') {
    return this.prisma.$transaction(async (tx) => {
      const hook = await tx.hook.findUnique({ where: { id: hookId }, include: { assignment: { include: { reply: true } } } });
      if (!hook || hook.authorId !== authorId) throw new NotFoundException('Hook 不存在');
      const reply = hook.assignment?.reply;
      if (!reply) throw new BadRequestException('这个 Hook 还没有收到回应');
      if (decision !== 'ACK' && !reply.wantsPrivateChat) throw new BadRequestException('对方没有申请建立私聊');
      if (reply.authorResponse) throw new BadRequestException('你已经处理过这次回应');
      const now = new Date();
      await tx.hookReply.update({ where: { id: reply.id }, data: { authorResponse: decision, authorRespondedAt: now } });
      await tx.hook.update({ where: { id: hook.id }, data: { status: HookStatus.CLOSED } });
      const accepted = decision === 'ACCEPT';
      await tx.matchLog.create({ data: { hookId: hook.id, recipientId: reply.recipientId, event: accepted ? 'PRIVATE_CHAT_ACCEPTED' : decision === 'DECLINE' ? 'PRIVATE_CHAT_DECLINED' : 'REPLY_ACKNOWLEDGED', reason: accepted ? '发帖者同意建立私聊' : decision === 'DECLINE' ? '发帖者婉拒建立私聊' : '发帖者已读并结束本次连接' } });
      return { decision, hookId };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async acknowledgeAuthorResponse(userId: string, assignmentId: string) {
    const assignment = await this.prisma.hookAssignment.findUnique({ where: { id: assignmentId }, include: { reply: true } });
    if (!assignment || assignment.recipientId !== userId) throw new NotFoundException('分配记录不存在');
    if (!assignment.reply?.authorResponse) throw new BadRequestException('暂时没有新的贴主回应');
    if (assignment.status === AssignmentStatus.CLOSED) return { acknowledged: true };
    await this.prisma.hookAssignment.update({ where: { id: assignmentId }, data: { status: AssignmentStatus.CLOSED, closedAt: new Date() } });
    return { acknowledged: true };
  }
}
