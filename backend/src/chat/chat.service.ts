import { Injectable } from '@nestjs/common';
import { AzureOpenAiService } from '../azure/azure-openai.service.js';

export interface ChatAnswer {
  answer: string;
  source: 'azure-openai';
}

// The system prompt lives in the backend so users can't change it.
const SYSTEM_PROMPT = [
  'You are AI Bridge, a helpful assistant for questions about Azure and software development.',
  'Answer clearly and concisely (a short paragraph unless more detail is asked for).',
  'If you are not sure about something, say so instead of guessing.',
].join(' ');

@Injectable()
export class ChatService {
  constructor(private readonly ai: AzureOpenAiService) {}

  // Phase 6: direct model call. Phase 10 turns this into RAG: embed → vector search → model.
  async answerQuestion(question: string): Promise<ChatAnswer> {
    const answer = await this.ai.generate(SYSTEM_PROMPT, question);
    return { answer, source: 'azure-openai' };
  }
}
