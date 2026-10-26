import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { env, exit } from 'node:process';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(env.PORT ?? 3001);
  await app.listen(port);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start Hook API', error);
  exit(1);
});
