import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';

// Shared by main.ts and the e2e tests, so tests run the same app configuration as production.
export function configureApp(app: NestExpressApplication) {
  const config = app.get(ConfigService);

  app.disable('x-powered-by');
  app.useBodyParser('json', { limit: '10kb' });
  app.enableCors({ origin: config.getOrThrow<string>('CORS_ORIGIN') });
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
