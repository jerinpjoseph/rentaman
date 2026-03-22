import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { CreateWorkerProfileDto } from './dto/create-worker-profile.dto';
import { UpdateWorkerProfileDto } from './dto/update-worker-profile.dto';
import { WorkerQueryDto } from './dto/worker-query.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../generated/prisma/client';

@ApiTags('Workers')
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post('profile')
  @Roles(Role.WORKER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create worker profile (worker only)' })
  async createProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkerProfileDto,
  ) {
    return this.workersService.createProfile(userId, dto);
  }

  @Get('me')
  @Roles(Role.WORKER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own worker profile' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.workersService.getMyProfile(userId);
  }

  @Patch('profile')
  @Roles(Role.WORKER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own worker profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkerProfileDto,
  ) {
    return this.workersService.updateProfile(userId, dto);
  }

  @Patch('availability')
  @Roles(Role.WORKER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle availability (online/offline)' })
  async updateAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.workersService.updateAvailability(userId, dto);
  }

  @Patch('location')
  @Roles(Role.WORKER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current location' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.workersService.updateLocation(userId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse available workers (public)' })
  async findAll(@Query() query: WorkerQueryDto) {
    return this.workersService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get worker detail by ID (public)' })
  async findById(@Param('id') id: string) {
    return this.workersService.findById(id);
  }
}
