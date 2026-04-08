import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MessageCategory } from '@prisma/client';

export class CreateConversationDto {
  @IsString()
  shipmentId: string;

  @IsString()
  recipientId: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageCategory)
  type?: MessageCategory;
}
