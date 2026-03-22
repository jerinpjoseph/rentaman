import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PlatformConfigService } from './platform-config.service';

@Controller('config')
export class PlatformConfigController {
  constructor(
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  @Public()
  @Get('commission')
  async getCommission() {
    const commissionPercent =
      await this.platformConfigService.getCommissionPercent();
    return { commissionPercent };
  }
}
