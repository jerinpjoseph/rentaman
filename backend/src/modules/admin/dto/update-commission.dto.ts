import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommissionDto {
  @ApiProperty({ example: 15, description: 'Commission percentage (0-50)' })
  @IsNumber()
  @Min(0)
  @Max(50)
  commissionPercent: number;
}
