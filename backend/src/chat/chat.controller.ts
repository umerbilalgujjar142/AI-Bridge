import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChatService, type ChatAnswer } from './chat.service.js';
import { ChatRequestDto } from './dto/chat-request.dto.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  chat(@Body() body: ChatRequestDto): Promise<ChatAnswer> {
    return this.chatService.answerQuestion(body.message);
  }
}
