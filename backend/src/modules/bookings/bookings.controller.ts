import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List all service categories' })
  async getCategories() {
    return this.prisma.serviceCategory.findMany({ orderBy: { name: 'asc' } });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking (customer only)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings (filtered by role)' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: BookingQueryDto,
  ) {
    return this.bookingsService.findAll(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.bookingsService.findById(id, userId, role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, userId, role, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a worker to a booking (customer only)' })
  async assignWorker(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AssignWorkerDto,
  ) {
    return this.bookingsService.assignWorker(id, userId, dto);
  }
}
