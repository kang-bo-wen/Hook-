import { Body, Controller, Headers, Patch, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UpdateProfileDto } from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Patch('me/profile')
  async updateProfile(@Headers('authorization') authorization: string | undefined, @Body() dto: UpdateProfileDto) {
    const user = await this.authService.getUserFromToken(this.extractToken(authorization));
    return this.authService.updateProfile(user.id, dto);
  }

  private extractToken(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('请先登录');
    return authorization.slice(7).trim();
  }
}
