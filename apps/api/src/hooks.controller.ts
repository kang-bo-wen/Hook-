import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateHookDto, UpdateHookDto } from './hooks.dto';
import { HooksService } from './hooks.service';

@Controller('hooks')
export class HooksController {
  constructor(private readonly authService: AuthService, private readonly hooksService: HooksService) {}

  @Post()
  async create(@Headers('authorization') authorization: string | undefined, @Body() dto: CreateHookDto) {
    return this.hooksService.create(await this.userId(authorization), dto);
  }

  @Get('mine')
  async mine(@Headers('authorization') authorization: string | undefined) {
    return this.hooksService.listMine(await this.userId(authorization));
  }

  @Get(':id')
  async detail(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.hooksService.getMine(await this.userId(authorization), id);
  }

  @Patch(':id')
  async update(@Headers('authorization') authorization: string | undefined, @Param('id') id: string, @Body() dto: UpdateHookDto) {
    return this.hooksService.update(await this.userId(authorization), id, dto);
  }

  @Delete(':id')
  async remove(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.hooksService.remove(await this.userId(authorization), id);
  }

  @Post(':id/publish')
  async publish(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.hooksService.publish(await this.userId(authorization), id);
  }

  @Post(':id/cancel-to-draft')
  async cancelToDraft(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.hooksService.cancelToDraft(await this.userId(authorization), id);
  }

  @Post(':id/close')
  async close(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    return this.hooksService.close(await this.userId(authorization), id);
  }

  private async currentUser(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('请先登录');
    return this.authService.getUserFromToken(authorization.slice(7).trim());
  }

  private userId(authorization?: string): Promise<string> {
    return this.currentUser(authorization).then((user) => user.id);
  }
}
