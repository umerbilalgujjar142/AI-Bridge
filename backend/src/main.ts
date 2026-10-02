import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  // Azure Container Apps sends SIGTERM before stopping a replica, so let Nest close cleanly.
  app.enableShutdownHooks();

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
  Logger.log(
    `AI Bridge backend listening on http://localhost:${port}`,
    'Bootstrap',
  );
}

await bootstrap();
