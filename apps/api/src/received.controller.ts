import { Body, Controller, Get, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MatchingService } from './matching.service';

@Controller('received')
export class ReceivedController {
  constructor(private readonly auth: AuthService, private readonly matching: MatchingService) {}

  @Get()
  async list(@Headers('authorization') authorization?: string) {
    return this.matching.received(await this.userId(authorization));
  }

  @Patch(':id/viewed')
  async viewed(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.matching.markViewed(await this.userId(authorization), id);
  }

  @Post(':id/decline')
  async decline(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.matching.decline(await this.userId(authorization), id);
  }

  private async userId(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('请先登录');
    return (await this.auth.getUserFromToken(authorization.slice(7).trim())).id;
  }
}
