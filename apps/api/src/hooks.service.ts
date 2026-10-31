import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HookStatus, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CreateHookDto, UpdateHookDto } from './hooks.dto';

const editableStatuses: HookStatus[] = [HookStatus.DRAFT, HookStatus.WAITING_MATCH];
const removableHistoricalStatuses: HookStatus[] = [HookStatus.CLOSED, HookStatus.EXPIRED, HookStatus.REJECTED];
const activePublishingStatuses: HookStatus[] = [HookStatus.WAITING_MATCH, HookStatus.ASSIGNED, HookStatus.ANSWERED];

@Injectable()
export class HooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateHookDto) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId: authorId }, select: { profileCompletedAt: true } });
    if (!profile?.profileCompletedAt) throw new BadRequestException('请先完善个人资料后再发布 Hook');
    const { saveAsDraft = false, ...data } = dto;
    if (saveAsDraft) return this.prisma.hook.create({ data: { ...data, authorId, status: HookStatus.DRAFT } });
    return this.prisma.$transaction(async (tx) => {
      await this.assertCanPublish(tx, authorId);
      return tx.hook.create({ data: { ...data, authorId, status: HookStatus.WAITING_MATCH } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  listMine(authorId: string) {
    return this.prisma.hook.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: { assignment: { select: { id: true, status: true, assignedAt: true, expiresAt: true, respondedAt: true, reply: true } }, replies: true },
    });
  }

  async getMine(authorId: string, hookId: string) {
    const hook = await this.prisma.hook.findUnique({ where: { id: hookId }, include: { assignment: { include: { reply: true } }, replies: true } });
    if (!hook) throw new NotFoundException('Hook 不存在');
    if (hook.authorId !== authorId) throw new ForbiddenException('无权查看此 Hook');
    return hook;
  }

  async update(authorId: string, hookId: string, dto: UpdateHookDto) {
    return this.prisma.$transaction(async (tx) => {
      const hook = await tx.hook.findUnique({ where: { id: hookId }, include: { assignment: { select: { id: true } } } });
      if (!hook) throw new NotFoundException('Hook 不存在');
      if (hook.authorId !== authorId) throw new ForbiddenException('无权编辑此 Hook');
      if (hook.assignment || !editableStatuses.includes(hook.status)) throw new BadRequestException('Hook 已经被分配，不能编辑');
      return tx.hook.update({ where: { id: hookId }, data: dto });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async publish(authorId: string, hookId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.assertCanPublish(tx, authorId);
      const hook = await tx.hook.findUnique({ where: { id: hookId } });
      if (!hook || hook.authorId !== authorId) throw new NotFoundException('Hook 不存在');
      if (hook.status !== HookStatus.DRAFT) throw new BadRequestException('只有草稿可以发布');
      const { id: _id, status: _status, createdAt: _createdAt, updatedAt: _updatedAt, ...draftData } = hook;
      return tx.hook.create({ data: { ...draftData, status: HookStatus.WAITING_MATCH } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async cancelToDraft(authorId: string, hookId: string) {
    return this.prisma.$transaction(async (tx) => {
      const hook = await tx.hook.findUnique({ where: { id: hookId }, include: { assignment: { select: { id: true } } } });
      if (!hook) throw new NotFoundException('Hook 不存在');
      if (hook.authorId !== authorId) throw new ForbiddenException('无权撤销此 Hook');
      if (hook.status !== HookStatus.WAITING_MATCH || hook.assignment) throw new BadRequestException('Hook 已匹配，不能撤销发布');
      return tx.hook.update({ where: { id: hookId }, data: { status: HookStatus.DRAFT } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async remove(authorId: string, hookId: string) {
    return this.prisma.$transaction(async (tx) => {
      const hook = await tx.hook.findUnique({ where: { id: hookId }, include: { assignment: { select: { id: true } } } });
      if (!hook) throw new NotFoundException('Hook 不存在');
      if (hook.authorId !== authorId) throw new ForbiddenException('无权删除此 Hook');
      const isEditableUnassigned = !hook.assignment && editableStatuses.includes(hook.status);
      const isClosedHistory = removableHistoricalStatuses.includes(hook.status);
      if (!isEditableUnassigned && !isClosedHistory) throw new BadRequestException('只有草稿、未匹配或已结束的 Hook 可以删除');
      await tx.hook.delete({ where: { id: hookId } });
      return { deleted: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async close(authorId: string, hookId: string) {
    const hook = await this.getMine(authorId, hookId);
    if (hook.status === HookStatus.CLOSED || hook.status === HookStatus.EXPIRED || hook.status === HookStatus.REJECTED) return hook;
    if (hook.assignment) throw new BadRequestException('Hook 已分配，不能撤回');
    return this.prisma.hook.update({ where: { id: hookId }, data: { status: HookStatus.CLOSED } });
  }

  private async assertCanPublish(tx: Prisma.TransactionClient, authorId: string, excludeHookId?: string) {
    const active = await tx.hook.findFirst({ where: { authorId, id: excludeHookId ? { not: excludeHookId } : undefined, status: { in: activePublishingStatuses } }, select: { id: true } });
    if (active) throw new BadRequestException('你已有一个进行中的 Hook，请先等待结果或撤销后再发布');
  }
}
