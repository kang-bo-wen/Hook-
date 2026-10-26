import { Body, Controller, Get, Headers, Patch, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ReceiverPreferencesService } from './receiver-preferences.service';
import { UpdateReceiverPreferenceDto } from './receiver-preferences.dto';

@Controller('receiver-preferences')
export class ReceiverPreferencesController {
  constructor(private readonly authService: AuthService, private readonly preferences: ReceiverPreferencesService) {}

  @Get('me')
  async get(@Headers('authorization') authorization: string | undefined) {
    return this.preferences.getNext(await this.userId(authorization));
  }

  @Patch('me')
  async update(@Headers('authorization') authorization: string | undefined, @Body() dto: UpdateReceiverPreferenceDto) {
    return this.preferences.updateNext(await this.userId(authorization), dto);
  }

  private async userId(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('请先登录');
    const user = await this.authService.getUserFromToken(authorization.slice(7).trim());
    return user.id;
  }
}
