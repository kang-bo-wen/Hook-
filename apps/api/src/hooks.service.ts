import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { HookStatus } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CreateHookDto, UpdateHookDto } from './hooks.dto';

const editableStatuses: HookStatus[] = [HookStatus.DRAFT, HookStatus.WAITING_MATCH];

@Injectable()
export class HooksService {
  constructor(private readonly prisma: PrismaService) {}

  create(authorId: string, dto: CreateHookDto) {
    return this.prisma.hook.create({
      data: { ...dto, authorId, status: HookStatus.WAITING_MATCH },
    });
  }

  listMine(authorId: string) {
    return this.prisma.hook.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      include: { assignment: { select: { id: true, status: true, assignedAt: true, respondedAt: true } } },
    });
  }

  async getMine(authorId: string, hookId: string) {
    const hook = await this.prisma.hook.findUnique({ where: { id: hookId }, include: { assignment: true, replies: true } });
    if (!hook) throw new NotFoundException('Hook 不存在');
    if (hook.authorId !== authorId) throw new ForbiddenException('无权查看此 Hook');
    return hook;
  }

  async update(authorId: string, hookId: string, dto: UpdateHookDto) {
    const hook = await this.getMine(authorId, hookId);
    if (!editableStatuses.includes(hook.status)) throw new BadRequestException('Hook 已经进入分配流程，暂时不能编辑');
    return this.prisma.hook.update({ where: { id: hookId }, data: dto });
  }

  async close(authorId: string, hookId: string) {
    const hook = await this.getMine(authorId, hookId);
    if (hook.status === HookStatus.CLOSED || hook.status === HookStatus.EXPIRED || hook.status === HookStatus.REJECTED) return hook;
    if (hook.assignment) throw new BadRequestException('Hook 已分配，不能撤回');
    return this.prisma.hook.update({ where: { id: hookId }, data: { status: HookStatus.CLOSED } });
  }
}
