import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus, Role } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, { status: string; allowedRoles: string[] }[]> = {
  PENDING: [
    { status: 'ACCEPTED', allowedRoles: ['WORKER'] },
    { status: 'CANCELLED', allowedRoles: ['CUSTOMER', 'ADMIN'] },
  ],
  ACCEPTED: [
    { status: 'IN_PROGRESS', allowedRoles: ['WORKER'] },
    { status: 'CANCELLED', allowedRoles: ['CUSTOMER', 'WORKER', 'ADMIN'] },
  ],
  IN_PROGRESS: [
    { status: 'COMPLETED', allowedRoles: ['WORKER'] },
  ],
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  async create(customerId: string, dto: CreateBookingDto) {
    // Verify customer role
    const customer = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!customer || customer.role !== Role.CUSTOMER) {
      throw new ForbiddenException('Only customers can create bookings');
    }

    // Verify worker exists and calculate total
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId: dto.workerId },
    });
    if (!workerProfile) {
      throw new NotFoundException('Worker not found');
    }
    const totalAmount = Number(workerProfile.hourlyRate) * dto.durationHours;

    // Calculate platform commission
    const commissionPercent = await this.platformConfigService.getCommissionPercent();
    const platformFee = Math.round((totalAmount * commissionPercent) / 100 * 100) / 100;
    const netAmount = Math.round((totalAmount - platformFee) * 100) / 100;

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        workerId: dto.workerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        scheduledDate: new Date(dto.scheduledDate),
        scheduledTime: dto.scheduledTime,
        durationHours: dto.durationHours,
        address: dto.address,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        notes: dto.notes,
        totalAmount,
        platformFeePercent: commissionPercent,
        platformFee,
        netAmount,
        status: BookingStatus.PENDING,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        worker: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    // Notify worker about new booking
    if (dto.workerId) {
      const notification = await this.notificationsService.create(
        dto.workerId,
        'New Booking Request',
        `New booking from ${customer.firstName} ${customer.lastName}: "${dto.title}"`,
        'booking:new',
        { bookingId: booking.id },
      );
      this.notificationsGateway.emitNewBooking(dto.workerId, booking);
      this.notificationsGateway.emitNotification(dto.workerId, notification);
    }

    return booking;
  }

  async findAll(userId: string, role: string, query: BookingQueryDto) {
    const { skip, limit, status, city } = query;

    const where: any = {};

    // Filter based on role
    if (role === Role.CUSTOMER) {
      where.customerId = userId;
    } else if (role === Role.WORKER) {
      where.workerId = userId;
    }
    // ADMIN sees all bookings

    if (status) {
      where.status = status;
    }
    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
          worker: {
            select: { id: true, firstName: true, lastName: true },
          },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: bookings,
      meta: {
        total,
        page: query.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(bookingId: string, userId: string, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        worker: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        category: true,
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only allow access to involved parties or admin
    if (
      role !== Role.ADMIN &&
      booking.customerId !== userId &&
      booking.workerId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async updateStatus(
    bookingId: string,
    userId: string,
    role: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check access
    if (
      role !== Role.ADMIN &&
      booking.customerId !== userId &&
      booking.workerId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    // Validate status transition
    const currentStatus = booking.status;
    const transitions = VALID_TRANSITIONS[currentStatus];

    if (!transitions) {
      throw new BadRequestException(
        `Booking in ${currentStatus} status cannot be changed`,
      );
    }

    const validTransition = transitions.find(
      (t) => t.status === dto.status && t.allowedRoles.includes(role),
    );

    if (!validTransition) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${dto.status} as ${role}`,
      );
    }

    const updateData: any = { status: dto.status };

    if (dto.status === BookingStatus.CANCELLED) {
      updateData.cancellationReason = dto.cancellationReason;
    }
    if (dto.status === BookingStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    }
    if (dto.status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();

      // Increment worker's totalBookings
      if (booking.workerId) {
        await this.prisma.workerProfile.update({
          where: { userId: booking.workerId },
          data: { totalBookings: { increment: 1 } },
        });
      }
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        worker: {
          select: { id: true, firstName: true, lastName: true },
        },
        category: { select: { id: true, name: true } },
      },
    });

    // Notify customer about status change
    const statusMessage = `Your booking "${booking.title}" has been updated to ${dto.status}`;
    const customerNotification = await this.notificationsService.create(
      booking.customerId,
      'Booking Update',
      statusMessage,
      'booking:statusUpdate',
      { bookingId: booking.id, status: dto.status },
    );
    this.notificationsGateway.emitBookingUpdate(booking.customerId, updatedBooking);
    this.notificationsGateway.emitNotification(booking.customerId, customerNotification);

    // Also notify worker if they didn't trigger the change
    if (booking.workerId && booking.workerId !== userId) {
      const workerNotification = await this.notificationsService.create(
        booking.workerId,
        'Booking Update',
        `Booking "${booking.title}" has been updated to ${dto.status}`,
        'booking:statusUpdate',
        { bookingId: booking.id, status: dto.status },
      );
      this.notificationsGateway.emitBookingUpdate(booking.workerId, updatedBooking);
      this.notificationsGateway.emitNotification(booking.workerId, workerNotification);
    }

    // Send email for terminal statuses
    if (dto.status === BookingStatus.COMPLETED || dto.status === BookingStatus.CANCELLED) {
      if (updatedBooking.customer?.email) {
        this.emailService.sendBookingStatusUpdate(
          (updatedBooking.customer as any).email,
          booking.title,
          dto.status,
        );
      }
    }

    return updatedBooking;
  }

  async assignWorker(bookingId: string, userId: string, dto: AssignWorkerDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== userId) {
      throw new ForbiddenException('Only the customer can assign a worker');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Can only assign worker to pending bookings');
    }

    // Verify worker exists and has a profile
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId: dto.workerId },
    });
    if (!workerProfile) {
      throw new NotFoundException('Worker profile not found');
    }

    const totalAmount = Number(workerProfile.hourlyRate) * Number(booking.durationHours);

    // Recalculate commission for new worker
    const commissionPercent = await this.platformConfigService.getCommissionPercent();
    const platformFee = Math.round((totalAmount * commissionPercent) / 100 * 100) / 100;
    const netAmount = Math.round((totalAmount - platformFee) * 100) / 100;

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        workerId: dto.workerId,
        totalAmount,
        platformFeePercent: commissionPercent,
        platformFee,
        netAmount,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
        worker: {
          select: { id: true, firstName: true, lastName: true },
        },
        category: { select: { id: true, name: true } },
      },
    });
  }
}
