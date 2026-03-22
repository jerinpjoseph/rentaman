import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    // Get the booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only customer can review
    if (booking.customerId !== reviewerId) {
      throw new ForbiddenException('Only the customer can review a booking');
    }

    // Only completed bookings can be reviewed
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Only one review per booking
    if (booking.review) {
      throw new ConflictException('This booking has already been reviewed');
    }

    if (!booking.workerId) {
      throw new BadRequestException('Cannot review a booking without a worker');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        reviewerId,
        revieweeId: booking.workerId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        booking: {
          select: { id: true, title: true },
        },
      },
    });

    // Recalculate worker's average rating
    const aggregation = await this.prisma.review.aggregate({
      where: { revieweeId: booking.workerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.workerProfile.update({
      where: { userId: booking.workerId },
      data: {
        avgRating: aggregation._avg.rating || 0,
        totalReviews: aggregation._count.rating,
      },
    });

    // Notify the worker about the new review
    const notification = await this.notificationsService.create(
      booking.workerId,
      'New Review',
      `You received a ${dto.rating}-star review for "${booking.title || 'your service'}"`,
      'review:new',
      { bookingId: booking.id, reviewId: review.id, rating: dto.rating },
    );
    this.notificationsGateway.emitNotification(booking.workerId, notification);

    return review;
  }

  async findByWorker(workerId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;

    // workerId here is the worker profile's user ID
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId: workerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          booking: {
            select: { id: true, title: true },
          },
        },
      }),
      this.prisma.review.count({ where: { revieweeId: workerId } }),
    ]);

    return {
      items: reviews,
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
