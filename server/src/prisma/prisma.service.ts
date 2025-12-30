import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private pool: Pool;

  constructor() {
    // Create a pg Pool with the DATABASE_URL
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Create Prisma adapter with the pool
    const adapter = new PrismaPg(this.pool);

    this.prisma = new PrismaClient({
      adapter,
    });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    await this.pool.end();
  }

  // Model accessors
  get user() {
    return this.prisma.user;
  }

  get shipment() {
    return this.prisma.shipment;
  }

  get shipmentOffer() {
    return this.prisma.shipmentOffer;
  }

  get travel() {
    return this.prisma.travel;
  }

  get conversation() {
    return this.prisma.conversation;
  }

  get message() {
    return this.prisma.message;
  }

  get paymentMethod() {
    return this.prisma.paymentMethod;
  }

  get transaction() {
    return this.prisma.transaction;
  }

  // Transaction support
  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }
}
