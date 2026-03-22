import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommissionPercent(): Promise<number> {
    const config = await this.prisma.platformConfig.findUnique({
      where: { key: 'commission_percent' },
    });
    return config ? parseFloat(config.value) : 15;
  }

  async updateCommissionPercent(
    percent: number,
    adminId: string,
  ): Promise<{ commissionPercent: number }> {
    if (percent < 0 || percent > 50) {
      throw new BadRequestException(
        'Commission percent must be between 0 and 50',
      );
    }

    await this.prisma.platformConfig.upsert({
      where: { key: 'commission_percent' },
      update: { value: String(percent), updatedBy: adminId },
      create: { key: 'commission_percent', value: String(percent), updatedBy: adminId },
    });

    return { commissionPercent: percent };
  }
}
