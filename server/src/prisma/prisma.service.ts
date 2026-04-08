import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const wantsSsl = /[?&]ssl=true/i.test(connectionString) || /[?&]sslmode=(require|no-verify)/i.test(connectionString);
    const allowSelfSigned = process.env.DATABASE_SSL_ALLOW_SELF_SIGNED === 'true';
    const normalizedConnectionString = allowSelfSigned
      ? connectionString.replace(/sslmode=require/gi, 'sslmode=no-verify')
      : connectionString;

    // Create a pg Pool with the DATABASE_URL
    this.pool = new Pool({
      connectionString: normalizedConnectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      min: Number(process.env.DATABASE_POOL_MIN ?? 0),
      idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? 10_000),
      keepAlive: true,
      keepAliveInitialDelayMillis: Number(process.env.DATABASE_POOL_KEEPALIVE_DELAY_MS ?? 10_000),
      ...(wantsSsl
        ? {
            ssl: {
              rejectUnauthorized: !allowSelfSigned,
            },
          }
        : {}),
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
