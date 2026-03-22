import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get user() {
    return this.client.user;
  }

  get workerProfile() {
    return this.client.workerProfile;
  }

  get serviceCategory() {
    return this.client.serviceCategory;
  }

  get booking() {
    return this.client.booking;
  }

  get review() {
    return this.client.review;
  }

  get notification() {
    return this.client.notification;
  }

  get platformConfig() {
    return this.client.platformConfig;
  }

  get conversation() {
    return this.client.conversation;
  }

  get message() {
    return this.client.message;
  }

  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }

  get $queryRaw() {
    return this.client.$queryRaw.bind(this.client);
  }
}
