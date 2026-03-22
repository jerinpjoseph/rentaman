import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignWorkerDto {
  @ApiProperty({ description: 'Worker user ID to assign' })
  @IsUUID()
  workerId: string;
}
