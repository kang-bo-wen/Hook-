import { Body, Controller, Get, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MatchingService } from './matching.service';
import { CreateHookReplyDto, RespondToHookReplyDto } from './received.dto';

@Controller('received')
export class ReceivedController {
  constructor(private readonly auth: AuthService, private readonly matching: MatchingService) {}

  @Get()
  async list(@Headers('authorization') authorization?: string, @Headers('x-session-token') sessionToken?: string) {
    return this.matching.received(await this.userId(authorization, sessionToken));
  }

  @Patch(':id/viewed')
  async viewed(@Headers('authorization') authorization: string | undefined, @Headers('x-session-token') sessionToken: string | undefined, @Param('id') id: string) {
    return this.matching.markViewed(await this.userId(authorization, sessionToken), id);
  }

  @Post(':id/decline')
  async decline(@Headers('authorization') authorization: string | undefined, @Headers('x-session-token') sessionToken: string | undefined, @Param('id') id: string) {
    return this.matching.decline(await this.userId(authorization, sessionToken), id);
  }

  @Post(':id/reply')
  async reply(@Headers('authorization') authorization: string | undefined, @Headers('x-session-token') sessionToken: string | undefined, @Param('id') id: string, @Body() dto: CreateHookReplyDto) {
    return this.matching.reply(await this.userId(authorization, sessionToken), id, dto.content, dto.wantsPrivateChat);
  }

  @Post('hook/:id/respond')
  async respondToReply(@Headers('authorization') authorization: string | undefined, @Headers('x-session-token') sessionToken: string | undefined, @Param('id') id: string, @Body() dto: RespondToHookReplyDto) {
    return this.matching.respondToReply(await this.userId(authorization, sessionToken), id, dto.decision);
  }

  @Post(':id/acknowledge-author')
  async acknowledgeAuthor(@Headers('authorization') authorization: string | undefined, @Headers('x-session-token') sessionToken: string | undefined, @Param('id') id: string) {
    return this.matching.acknowledgeAuthorResponse(await this.userId(authorization, sessionToken), id);
  }

  private async userId(authorization?: string, sessionToken?: string) {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : sessionToken?.trim();
    if (!token) throw new UnauthorizedException('登录信息未传递，请刷新页面后重试');
    return (await this.auth.getUserFromToken(token)).id;
  }
}
