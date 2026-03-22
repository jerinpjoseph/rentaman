import { PartialType } from '@nestjs/swagger';
import { CreateWorkerProfileDto } from './create-worker-profile.dto';

export class UpdateWorkerProfileDto extends PartialType(CreateWorkerProfileDto) {}
