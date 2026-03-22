import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay Order ID' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay Payment ID' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'Razorpay Signature for verification' })
  @IsString()
  razorpaySignature: string;
}
