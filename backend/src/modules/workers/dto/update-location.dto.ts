import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @ApiProperty({ example: 19.076 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 72.8777 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: '123 Main Street, Mumbai' })
  @IsOptional()
  @IsString()
  address?: string;
}
