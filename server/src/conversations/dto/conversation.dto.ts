import { IsString, IsOptional } from 'class-validator';

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
  @IsString()
  type?: string; // TEXT, SYSTEM, MATCH_REQUEST
}
