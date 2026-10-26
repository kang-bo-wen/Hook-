import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HooksController } from './hooks.controller';
import { HooksService } from './hooks.service';
import { PrismaService } from './prisma.service';
import { ReceiverPreferencesController } from './receiver-preferences.controller';
import { ReceiverPreferencesService } from './receiver-preferences.service';
import { UsersController } from './users.controller';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'hook-api', database: 'ok' };
  }
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return this.appService.health();
  }
}

@Module({
  controllers: [AppController, AuthController, UsersController, HooksController, ReceiverPreferencesController, AdminController],
  providers: [AppService, PrismaService, AuthService, HooksService, ReceiverPreferencesService, AdminService],
  exports: [PrismaService],
})
export class AppModule {}
