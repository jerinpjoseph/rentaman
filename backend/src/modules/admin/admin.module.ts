import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlatformConfigModule } from '../platform-config/platform-config.module';

@Module({
  imports: [PlatformConfigModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
