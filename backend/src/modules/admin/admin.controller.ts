import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../generated/prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '../../generated/prisma/client';
import { UpdateCommissionDto } from './dto/update-commission.dto';

class VerifyWorkerDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED'] })
  @IsEnum(VerificationStatus)
  status: 'VERIFIED' | 'REJECTED';
}

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('verifications')
  @ApiOperation({ summary: 'List pending worker verifications' })
  async getPendingVerifications(@Query() pagination: PaginationDto) {
    return this.adminService.getPendingVerifications(pagination);
  }

  @Patch('verifications/:id')
  @ApiOperation({ summary: 'Approve or reject a worker verification' })
  async verifyWorker(
    @Param('id') id: string,
    @Body() dto: VerifyWorkerDto,
  ) {
    return this.adminService.verifyWorker(id, dto.status);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List all bookings' })
  async getAllBookings(@Query() pagination: PaginationDto) {
    return this.adminService.getAllBookings(pagination);
  }

  @Get('config/commission')
  @ApiOperation({ summary: 'Get current commission percentage' })
  async getCommission() {
    const commissionPercent = await this.platformConfigService.getCommissionPercent();
    return { commissionPercent };
  }

  @Patch('config/commission')
  @ApiOperation({ summary: 'Update commission percentage' })
  async updateCommission(
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdateCommissionDto,
  ) {
    return this.platformConfigService.updateCommissionPercent(dto.commissionPercent, adminId);
  }
}
