import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { MatchingService } from './matching.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService, private readonly matching: MatchingService) {}

  @Post('login')
  login(@Body() body: { username?: string; password?: string }) {
    if (typeof body.username !== 'string' || typeof body.password !== 'string') throw new UnauthorizedException('账号或密码错误');
    return this.admin.login(body.username, body.password);
  }

  @Get('users')
  users(@Headers('authorization') authorization?: string) {
    this.admin.authorize(authorization);
    return this.admin.listUsers();
  }

  @Post('match')
  match(@Headers('authorization') authorization: string | undefined, @Body() body?: { hookId?: string }) {
    this.admin.authorize(authorization);
    return this.matching.run(body?.hookId);
  }

  @Get('hooks')
  hooks(@Headers('authorization') authorization?: string) {
    this.admin.authorize(authorization);
    return this.admin.listHooks();
  }
}
