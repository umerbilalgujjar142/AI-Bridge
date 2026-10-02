import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { ChatModule } from './chat/chat.module.js';
import { AzureModule } from './azure/azure.module.js';
import { DbModule } from './db/db.module.js';
import { RagModule } from './rag/rag.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    HealthModule,
    ChatModule,
    AzureModule,
    DbModule,
    RagModule,
  ],
})
export class AppModule {}
