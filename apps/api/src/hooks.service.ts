import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HookStatus, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CreateHookDto, UpdateHookDto } from './hooks.dto';

const editableStatuses: HookStatus[] = [HookStatus.DRAFT, HookStatus.WAITING_MATCH];

@Injectable()
export class HooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateHookDto) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId: authorId }, select: { profileCompletedAt: true } });
    if (!profile?.profileCompletedAt) throw new BadRequestException('请先完善个人资料后再发布 Hook');
    return this.prisma.hook.create({
      data: { ...dto, authorId, status: HookStatus.WAITING_MATCH },
    });
  }

  listMine(authorId: string) {
    return this.prisma.hook.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: { assignment: { select: { id: true, status: true, assignedAt: true, expiresAt: true, respondedAt: true } } },
    });
  }

  async getMine(authorId: string, hookId: string) {
    const hook = await this.prisma.hook.findUnique({ where: { id: hookId }, include: { assignment: true, replies: true } });
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

  async remove(authorId: string, hookId: string) {
    return this.prisma.$transaction(async (tx) => {
      const hook = await tx.hook.findUnique({ where: { id: hookId }, include: { assignment: { select: { id: true } } } });
      if (!hook) throw new NotFoundException('Hook 不存在');
      if (hook.authorId !== authorId) throw new ForbiddenException('无权删除此 Hook');
      if (hook.assignment || !editableStatuses.includes(hook.status)) throw new BadRequestException('Hook 已经被分配，不能删除');
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
}
