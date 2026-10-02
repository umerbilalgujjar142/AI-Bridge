import { Global, Module } from '@nestjs/common';
import { KnowledgeStore } from './knowledge-store.service.js';

@Global()
@Module({
  providers: [KnowledgeStore],
  exports: [KnowledgeStore],
})
export class RagModule {}
