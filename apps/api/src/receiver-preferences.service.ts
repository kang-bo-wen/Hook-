import { Injectable } from '@nestjs/common';
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
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.receiverPreference.updateMany({
        where: { userId, scope: PreferenceScope.NEXT_HOOK, effectiveUntil: null },
        data: { effectiveUntil: now },
      });
      return tx.receiverPreference.create({
        data: { ...dto, userId, scope: PreferenceScope.NEXT_HOOK, effectiveFrom: now },
      });
    });
  }
}
