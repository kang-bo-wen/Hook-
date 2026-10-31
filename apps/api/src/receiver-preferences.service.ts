import { BadRequestException, Injectable } from '@nestjs/common';
import { PreferenceScope } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { UpdateReceiverPreferenceDto } from './receiver-preferences.dto';

@Injectable()
export class ReceiverPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  getNext(userId: string) {
    return this.prisma.receiverPreference.findFirst({
      where: { userId, scope: PreferenceScope.NEXT_HOOK, effectiveUntil: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateNext(userId: string, dto: UpdateReceiverPreferenceDto) {
    const normalized = { ...dto, expectedGrades: dto.expectedGrades ?? [], expectedFuturePlans: dto.expectedFuturePlans ?? [] };
    const overlap = normalized.topicTypes.filter((topic) => normalized.excludedTypes.includes(topic));
    if (overlap.length) throw new BadRequestException(`同一话题不能同时选择想接收和排除：${overlap.join('、')}`);
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.receiverPreference.updateMany({
        where: { userId, scope: PreferenceScope.NEXT_HOOK, effectiveUntil: null },
        data: { effectiveUntil: now },
      });
      return tx.receiverPreference.create({
        data: { ...normalized, userId, scope: PreferenceScope.NEXT_HOOK, effectiveFrom: now },
      });
    });
  }
}
