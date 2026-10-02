import { Injectable } from '@nestjs/common';

export interface ChatAnswer {
  answer: string;
  source: 'mock';
}

@Injectable()
export class ChatService {
  // Phase 1: mock. Later phases replace this body with: embed → vector search → Azure AI model.
  answerQuestion(question: string): Promise<ChatAnswer> {
    return Promise.resolve({
      answer: `Mock response. You asked: "${question}"`,
      source: 'mock',
    });
  }
}
