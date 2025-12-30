import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddPaymentMethodDto, HoldPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Detect card type from card number
   */
  private detectCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return 'unknown';
  }

  /**
   * Add a payment method (fake - in production use Stripe)
   */
  async addPaymentMethod(userId: string, dto: AddPaymentMethodDto) {
    const cleaned = dto.cardNumber.replace(/\s/g, '');
    
    // Basic validation
    if (cleaned.length < 13 || cleaned.length > 19) {
      throw new BadRequestException('Invalid card number');
    }

    const cardType = this.detectCardType(cleaned);
    const lastFour = cleaned.slice(-4);

    // If setting as default, unset others
    if (dto.setAsDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Check if this is the first card (make it default)
    const existingCards = await this.prisma.paymentMethod.count({
      where: { userId },
    });

    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        cardType,
        lastFour,
        cardHolder: dto.cardHolder,
        expiryMonth: dto.expiryMonth,
        expiryYear: dto.expiryYear,
        isDefault: dto.setAsDefault || existingCards === 0,
        userId,
      },
    });

    return paymentMethod;
  }

  /**
   * Get all payment methods for a user
   */
  async getPaymentMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get default payment method
   */
  async getDefaultPaymentMethod(userId: string) {
    return this.prisma.paymentMethod.findFirst({
      where: { userId, isDefault: true },
    });
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    if (method.userId !== userId) {
      throw new ForbiddenException('Not your payment method');
    }

    // Unset all others
    await this.prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set this one
    return this.prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    });
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    if (method.userId !== userId) {
      throw new ForbiddenException('Not your payment method');
    }

    await this.prisma.paymentMethod.delete({
      where: { id: paymentMethodId },
    });

    // If it was default, set another as default
    if (method.isDefault) {
      const another = await this.prisma.paymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (another) {
        await this.prisma.paymentMethod.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  /**
   * Hold payment for a shipment match (fake payment)
   */
  async holdPayment(userId: string, dto: HoldPaymentDto) {
    // Get shipment
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: dto.shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.senderId !== userId) {
      throw new ForbiddenException('Only the sender can hold payment');
    }

    if (shipment.status !== 'OPEN') {
      throw new BadRequestException('Shipment is not open for matching');
    }

    // Check for existing transaction
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { shipmentId: dto.shipmentId },
    });

    if (existingTransaction) {
      throw new BadRequestException('Payment already exists for this shipment');
    }

    // Get payment method
    let paymentMethod;
    if (dto.paymentMethodId) {
      paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: dto.paymentMethodId },
      });
      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw new BadRequestException('Invalid payment method');
      }
    } else {
      // Use default
      paymentMethod = await this.getDefaultPaymentMethod(userId);
      if (!paymentMethod) {
        throw new BadRequestException('No payment method available. Please add a card first.');
      }
    }

    // Create transaction with HELD status (fake hold)
    const transaction = await this.prisma.transaction.create({
      data: {
        amount: shipment.price,
        currency: shipment.currency,
        status: 'HELD',
        description: `Payment held for shipment ${shipment.originCity} → ${shipment.destCity}`,
        payerId: userId,
        payeeId: dto.courierId,
        shipmentId: dto.shipmentId,
        paymentMethodId: paymentMethod.id,
      },
    });

    // Update shipment status and assign courier
    await this.prisma.shipment.update({
      where: { id: dto.shipmentId },
      data: {
        status: 'MATCHED',
        courierId: dto.courierId,
      },
    });

    return {
      success: true,
      transaction,
      message: `$${shipment.price} ${shipment.currency} held successfully. Funds will be released upon delivery.`,
    };
  }

  /**
   * Release payment to courier (when delivery confirmed)
   */
  async releasePayment(userId: string, shipmentId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { shipmentId },
      include: { shipment: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.payerId !== userId) {
      throw new ForbiddenException('Only the sender can release payment');
    }

    if (transaction.status !== 'HELD') {
      throw new BadRequestException('Payment is not in held status');
    }

    // Update transaction
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'RELEASED' },
    });

    // Update shipment
    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: 'DELIVERED' },
    });

    return {
      success: true,
      message: `$${transaction.amount} ${transaction.currency} released to courier!`,
    };
  }

  /**
   * Refund payment (cancel match)
   */
  async refundPayment(userId: string, shipmentId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { shipmentId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.payerId !== userId) {
      throw new ForbiddenException('Only the sender can request refund');
    }

    if (transaction.status !== 'HELD') {
      throw new BadRequestException('Payment cannot be refunded');
    }

    // Update transaction
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'REFUNDED' },
    });

    // Update shipment back to open
    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { 
        status: 'OPEN',
        courierId: null,
      },
    });

    return {
      success: true,
      message: `$${transaction.amount} ${transaction.currency} refunded successfully.`,
    };
  }

  /**
   * Get transactions for a user
   */
  async getUserTransactions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ payerId: userId }, { payeeId: userId }],
      },
      include: {
        shipment: {
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true },
            },
            courier: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        paymentMethod: {
          select: { cardType: true, lastFour: true },
        },
        payer: {
          select: { id: true, firstName: true, lastName: true },
        },
        payee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add role information and format response
    return transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      createdAt: t.createdAt,
      shipment: t.shipment ? {
        id: t.shipment.id,
        content: t.shipment.content,
        title: t.shipment.content,
        originCity: t.shipment.originCity,
        originCountry: t.shipment.originCountry,
        destCity: t.shipment.destCity,
        destCountry: t.shipment.destCountry,
        price: t.shipment.price,
        currency: t.shipment.currency,
        status: t.shipment.status,
        dateStart: t.shipment.dateStart,
        dateEnd: t.shipment.dateEnd,
        sender: t.shipment.sender,
        courier: t.shipment.courier,
        senderPhone: t.shipment.senderPhone,
      } : null,
      paymentMethod: t.paymentMethod,
      role: t.payerId === userId ? 'sender' : 'courier',
      otherUser: t.payerId === userId ? t.payee : t.payer,
    }));
  }
}
