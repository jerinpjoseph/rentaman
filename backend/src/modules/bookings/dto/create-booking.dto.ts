import { IsString, IsOptional, IsDateString, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: 'Hospital visit for my father' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Need someone to accompany my father to Apollo Hospital' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Service category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Selected worker ID (mandatory)' })
  @IsUUID()
  workerId: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  scheduledTime: string;

  @ApiProperty({ example: 3, description: 'Duration in hours' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  durationHours: number;

  @ApiProperty({ example: '123 Main Street, Mumbai' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 19.076 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.8777 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Please bring a wheelchair' })
  @IsOptional()
  @IsString()
  notes?: string;
}
