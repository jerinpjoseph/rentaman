import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class MessageQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Cursor message ID for loading older messages' })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
