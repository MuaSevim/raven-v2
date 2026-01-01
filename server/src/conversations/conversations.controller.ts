import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('conversations')
@UseGuards(FirebaseAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  /**
   * Get or create a conversation
   */
  @Post()
  getOrCreate(@Request() req, @Body() dto: CreateConversationDto) {
    return this.conversationsService.getOrCreateConversation(
      req.user.uid,
      req.user.email,
      dto,
    );
  }

  /**
   * Get all conversations for current user (Inbox)
   */
  @Get()
  getUserConversations(@Request() req) {
    return this.conversationsService.getUserConversations(req.user.uid);
  }

  /**
   * Get unread message count
   */
  @Get('unread')
  getUnreadCount(@Request() req) {
    return this.conversationsService.getUnreadCount(req.user.uid);
  }

  /**
   * Get a single conversation
   */
  @Get(':id')
  getConversation(@Request() req, @Param('id') id: string) {
    return this.conversationsService.getConversationById(req.user.uid, id);
  }

  /**
   * Send a message in a conversation
   */
  @Post(':id/messages')
  sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(req.user.uid, id, dto);
  }

  /**
   * Mark all messages in a conversation as read
   */
  @Post(':id/read')
  markAsRead(@Request() req, @Param('id') id: string) {
    return this.conversationsService.markMessagesAsRead(req.user.uid, id);
  }
}
