import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'The other participant user ID' })
  @IsUUID()
  participantId: string;

  @ApiPropertyOptional({ description: 'Optional booking ID to link the conversation' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;
}
