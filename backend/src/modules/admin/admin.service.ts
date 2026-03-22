import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus, BookingStatus } from '../../generated/prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalWorkers, totalBookings, completedBookings, pendingVerifications] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.workerProfile.count(),
        this.prisma.booking.count(),
        this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
        this.prisma.workerProfile.count({
          where: { verificationStatus: VerificationStatus.PENDING },
        }),
      ]);

    const revenueResult = await this.prisma.booking.aggregate({
      where: { status: BookingStatus.COMPLETED },
      _sum: { totalAmount: true, platformFee: true, netAmount: true },
    });

    return {
      totalUsers,
      totalWorkers,
      totalBookings,
      completedBookings,
      pendingVerifications,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      platformRevenue: revenueResult._sum.platformFee || 0,
      workerPayouts: revenueResult._sum.netAmount || 0,
    };
  }

  async getPendingVerifications(pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const [workers, total] = await Promise.all([
      this.prisma.workerProfile.findMany({
        where: { verificationStatus: VerificationStatus.PENDING },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true },
          },
        },
      }),
      this.prisma.workerProfile.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
    ]);

    return {
      items: workers,
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyWorker(workerProfileId: string, status: 'VERIFIED' | 'REJECTED') {
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      throw new BadRequestException('Status must be VERIFIED or REJECTED');
    }

    const profile = await this.prisma.workerProfile.findUnique({
      where: { id: workerProfileId },
    });
    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.prisma.workerProfile.update({
      where: { id: workerProfileId },
      data: { verificationStatus: status as VerificationStatus },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async getAllBookings(pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          worker: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.booking.count(),
    ]);

    return {
      items: bookings,
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
