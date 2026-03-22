import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Booking ID to create payment order for' })
  @IsUUID()
  bookingId: string;
}
