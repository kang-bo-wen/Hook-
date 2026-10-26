import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, SendEmailCodeDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-email-code')
  sendEmailCode(@Body() dto: SendEmailCodeDto) {
    return this.authService.sendEmailCode(dto.email);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.nickname, dto.verificationCode);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.getUserFromToken(this.extractToken(authorization));
  }

  private extractToken(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('请先登录');
    return authorization.slice(7).trim();
  }
}
