import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

@Injectable()
export class PaymentsService {
  private razorpay: any;
  private keyId: string;
  private keySecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly platformConfigService: PlatformConfigService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');

    if (this.keyId && this.keySecret) {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    }
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!this.razorpay) {
      throw new BadRequestException('Payment gateway is not configured');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        worker: {
          select: { id: true, firstName: true, lastName: true, workerProfile: { select: { hourlyRate: true } } },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== userId) {
      throw new ForbiddenException('Only the booking customer can make payment');
    }

    if (booking.paymentStatus === 'PAID') {
      throw new BadRequestException('Booking is already paid');
    }

    if (!booking.workerId) {
      throw new BadRequestException('Booking must have a worker assigned before payment');
    }

    // Calculate amount if not already set
    let amount = Number(booking.totalAmount || 0);
    if (!amount && booking.worker?.workerProfile) {
      amount = Number(booking.worker.workerProfile.hourlyRate) * Number(booking.durationHours);
      const commissionPercent = await this.platformConfigService.getCommissionPercent();
      const platformFee = Math.round((amount * commissionPercent) / 100 * 100) / 100;
      const netAmount = Math.round((amount - platformFee) * 100) / 100;
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { totalAmount: amount, platformFeePercent: commissionPercent, platformFee, netAmount },
      });
    }

    if (amount <= 0) {
      throw new BadRequestException('Invalid booking amount');
    }

    // Create Razorpay order (amount in paise)
    const order = await this.razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: booking.id,
      notes: {
        bookingId: booking.id,
        customerId: userId,
      },
    });

    // Store the Razorpay order ID on the booking
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { razorpayOrderId: order.id },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking.id,
      keyId: this.keyId,
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { razorpayOrderId: dto.razorpayOrderId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        worker: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found for this order');
    }

    if (booking.customerId !== userId) {
      throw new ForbiddenException('Only the booking customer can verify payment');
    }

    // Verify HMAC signature
    const body = dto.razorpayOrderId + '|' + dto.razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      // Payment verification failed
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: 'FAILED' as any },
      });
      throw new BadRequestException('Payment verification failed');
    }

    // Payment verified - update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAID' as any,
        paymentId: dto.razorpayPaymentId,
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        worker: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Notify the worker about the new paid booking
    if (booking.workerId) {
      const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;
      const notification = await this.notificationsService.create(
        booking.workerId,
        'New Booking Request',
        `You have a new booking from ${customerName}: "${booking.title}"`,
        'booking:new',
        { bookingId: booking.id },
      );
      this.notificationsGateway.emitNewBooking(booking.workerId, updatedBooking);
      this.notificationsGateway.emitNotification(booking.workerId, notification);
    }

    return updatedBooking;
  }
}
