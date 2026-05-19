import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { MessageCategory, ShipmentStatus, TransactionStatus, OfferStatus, ConversationStatus, Prisma } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) { }

  private normalizeShipmentStatus(status: string): ShipmentStatus {
    const normalized = status?.toUpperCase();
    if (!normalized || !(normalized in ShipmentStatus)) {
      throw new ForbiddenException(`Invalid shipment status: ${status}`);
    }

    return normalized as ShipmentStatus;
  }

  private normalizeShipmentStatusFilter(status?: string): ShipmentStatus | undefined {
    if (!status) {
      return undefined;
    }
    return this.normalizeShipmentStatus(status);
  }

  private resolveImageUrl(imageUrl?: string): string | null {
    if (!imageUrl) {
      return null;
    }

    if (imageUrl.startsWith('data:') || imageUrl.startsWith('file://')) {
      return null;
    }

    return imageUrl;
  }

  async create(senderId: string, senderEmail: string, createShipmentDto: CreateShipmentDto) {
    // Split the full name into firstName and lastName
    const fullName = createShipmentDto.senderFullName || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Ensure user exists in database (upsert if not)
    const existingUser = await this.prisma.user.findUnique({ where: { id: senderId } });

    if (!existingUser) {
      throw new NotFoundException('Sender not found');
    } else if (firstName || lastName) {
      // Update name if provided and user doesn't have one
      await this.prisma.user.update({
        where: { id: senderId },
        data: {
          ...(firstName && !existingUser.firstName ? { firstName } : {}),
          ...(lastName && !existingUser.lastName ? { lastName } : {}),
        },
      });
    }

    // One-active-delivery rule: user can only have one active shipment at a time
    const activeShipment = await this.prisma.shipment.findFirst({
      where: {
        senderId,
        status: { in: [ShipmentStatus.OPEN, ShipmentStatus.MATCHED, ShipmentStatus.HANDED_OVER, ShipmentStatus.ON_WAY] },
      },
    });

    if (activeShipment) {
      throw new ForbiddenException(
        'You already have an active delivery. Please complete or cancel it before creating a new one.'
      );
    }

    const {
      dateStart,
      dateEnd,
      paymentMethod: _paymentMethod,
      imageUrl,
      ...shipmentData
    } = createShipmentDto;

    return this.prisma.shipment.create({
      data: {
        ...shipmentData,
        imageUrl: this.resolveImageUrl(imageUrl),
        dateStart: new Date(dateStart),
        dateEnd: new Date(dateEnd),
        senderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
                verificationStatus: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    status?: string;
    originCountry?: string;
    destCountry?: string;
    minWeight?: number;
    maxWeight?: number;
    minPrice?: number;
    maxPrice?: number;
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.ShipmentWhereInput = {};

    // Default: only show OPEN, non-expired shipments
    where.status = this.normalizeShipmentStatusFilter(filters?.status) ?? ShipmentStatus.OPEN;
    where.dateEnd = { gte: new Date() };

    if (filters?.originCountry) {
      where.originCountry = { contains: filters.originCountry, mode: 'insensitive' };
    }
    if (filters?.destCountry) {
      where.destCountry = { contains: filters.destCountry, mode: 'insensitive' };
    }
    if (filters?.minWeight || filters?.maxWeight) {
      where.weight = {};
      if (filters.minWeight) where.weight.gte = filters.minWeight;
      if (filters.maxWeight) where.weight.lte = filters.maxWeight;
    }
    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    return this.prisma.shipment.findMany({
      where,
      take: filters?.take ?? 50,
      skip: filters?.skip ?? 0,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
                verificationStatus: true,
          },
        },
        _count: {
          select: { offers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
                verificationStatus: true,
            country: true,
            city: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
                verificationStatus: true,
          },
        },
        offers: {
          include: {
            courier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                    verificationStatus: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return shipment;
  }

  async findByUser(userId: string, role: 'sender' | 'courier', take = 50, skip = 0) {
    const where = role === 'sender'
      ? { senderId: userId }
      : { courierId: userId };

    return this.prisma.shipment.findMany({
      where,
      take,
      skip,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
                verificationStatus: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
                verificationStatus: true,
          },
        },
        _count: {
          select: { offers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all offers made by a user
   */
  async findOffersByUser(userId: string, take = 50, skip = 0) {
    return this.prisma.shipmentOffer.findMany({
      where: { courierId: userId },
      take,
      skip,
      include: {
        shipment: {
          select: {
            id: true,
            originCity: true,
            destCity: true,
            price: true,
            currency: true,
            status: true,
            content: true,
            senderId: true,
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                    verificationStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, userId: string, status: string) {
    const nextStatus = this.normalizeShipmentStatus(status);

    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Only sender can cancel, only courier can update to ON_WAY or DELIVERED
    if (nextStatus === ShipmentStatus.CANCELLED && shipment.senderId !== userId) {
      throw new ForbiddenException('Only the sender can cancel this shipment');
    }

    if (
      (nextStatus === ShipmentStatus.ON_WAY || nextStatus === ShipmentStatus.DELIVERED) &&
      shipment.courierId !== userId
    ) {
      throw new ForbiddenException('Only the assigned courier can update delivery status');
    }

    return this.prisma.shipment.update({
      where: { id },
      data: { status: nextStatus },
    });
  }

  // Offers
  async createOffer(shipmentId: string, courierId: string, createOfferDto: CreateOfferDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.status !== ShipmentStatus.OPEN) {
      throw new ForbiddenException('Cannot make offer on a shipment that is not open');
    }

    if (shipment.senderId === courierId) {
      throw new ForbiddenException('Cannot make offer on your own shipment');
    }

    // Check if courier already made an offer
    const existingOffer = await this.prisma.shipmentOffer.findFirst({
      where: { shipmentId, courierId },
    });

    if (existingOffer) {
      throw new ForbiddenException('You have already made an offer on this shipment');
    }

    // Create the offer
    const offer = await this.prisma.shipmentOffer.create({
      data: {
        ...createOfferDto,
        shipmentId,
        courierId,
      },
      include: {
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            verificationStatus: true,
          },
        },
      },
    });

    // Get or create conversation — sender is ALWAYS user1, courier is ALWAYS user2
    const user1Id = shipment.senderId; // sender
    const user2Id = courierId;         // courier
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        shipmentId,
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          user1Id,
          user2Id,
          shipmentId,
        },
      });
    }

    // Create the offer message in the conversation
    await this.prisma.message.create({
      data: {
        content: createOfferDto.message,
        type: MessageCategory.OFFER,
        conversationId: conversation.id,
        senderId: courierId,
      },
    });

    // Update conversation with last message
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: createOfferDto.message,
        lastMessageAt: new Date(),
      },
    });

    return offer;
  }

  /**
   * Accept an offer — only the shipment sender can trigger this.
   * Changes Offer → ACCEPTED, assigns courier, Shipment → MATCHED.
   */
  async acceptOffer(shipmentId: string, offerId: string, userId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.senderId !== userId) {
      throw new ForbiddenException('Only the shipment sender can accept offers');
    }

    if (shipment.status !== ShipmentStatus.OPEN) {
      throw new ForbiddenException('Can only accept offers on OPEN shipments');
    }

    const offer = await this.prisma.shipmentOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.shipmentId !== shipmentId) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new ForbiddenException('This offer has already been processed');
    }

    // Accept the offer
    await this.prisma.shipmentOffer.update({
      where: { id: offerId },
      data: { status: OfferStatus.ACCEPTED },
    });

    // Reject all other pending offers on this shipment
    await this.prisma.shipmentOffer.updateMany({
      where: {
        shipmentId,
        id: { not: offerId },
        status: OfferStatus.PENDING,
      },
      data: { status: OfferStatus.REJECTED },
    });

    // Assign courier and move shipment to MATCHED
    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        courierId: offer.courierId,
        status: ShipmentStatus.MATCHED,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true, verificationStatus: true },
        },
        courier: {
          select: { id: true, firstName: true, lastName: true, avatar: true, verificationStatus: true },
        },
      },
    });

    return {
      shipment: updated,
      offerId: offer.id,
      message: 'Offer accepted! You are now matched with this courier.',
    };
  }

  /**
   * Counter-offer — the shipment sender proposes a different price.
   * Updates the offer's counterPrice and also updates the shipment's price.
   */
  async counterOffer(shipmentId: string, offerId: string, userId: string, counterPrice: number) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.senderId !== userId) {
      throw new ForbiddenException('Only the shipment sender can counter-offer');
    }

    if (shipment.status !== ShipmentStatus.OPEN) {
      throw new ForbiddenException('Can only counter-offer on OPEN shipments');
    }

    const offer = await this.prisma.shipmentOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.shipmentId !== shipmentId) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new ForbiddenException('This offer has already been processed');
    }

    // Update the offer with counter price
    await this.prisma.shipmentOffer.update({
      where: { id: offerId },
      data: { counterPrice },
    });

    // Also update the shipment's listed price
    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { price: counterPrice },
    });

    // Send a system message to the conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: { shipmentId },
    });

    if (conversation) {
      const currency = shipment.currency || 'USD';
      const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
      const message = `💰 Counter offer: ${symbol}${counterPrice}`;

      await this.prisma.message.create({
        data: {
          content: message,
          type: MessageCategory.SYSTEM,
          conversationId: conversation.id,
          senderId: userId,
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: message,
          lastMessageAt: new Date(),
        },
      });
    }

    return {
      counterPrice,
      message: `Counter offer of ${counterPrice} has been sent.`,
    };
  }

  async getUserOfferOnShipment(shipmentId: string, userId: string) {
    const offer = await this.prisma.shipmentOffer.findFirst({
      where: {
        shipmentId,
        courierId: userId,
      },
      include: {
        shipment: {
          select: {
            senderId: true,
          },
        },
      },
    });

    if (!offer) return null;

    // Get or create conversation for this offer
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        shipmentId,
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
    });

    return {
      id: offer.id,
      status: offer.status,
      conversationId: conversation?.id,
    };
  }

  /**
   * Confirm handover - called by either sender or courier
   * When both confirm, status changes to HANDED_OVER, then auto-advances to ON_WAY
   */
  async confirmHandover(shipmentId: string, userId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: {
        id: true,
        status: true,
        senderId: true,
        courierId: true,
        senderConfirmedHandover: true,
        courierConfirmedHandover: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Verify user is either sender or courier
    const isSender = shipment.senderId === userId;
    const isCourier = shipment.courierId === userId;

    if (!isSender && !isCourier) {
      throw new ForbiddenException('You are not authorized to confirm this shipment');
    }

    if (!shipment.courierId) {
      throw new ForbiddenException('Cannot confirm handover - no courier assigned');
    }

    if (shipment.status !== ShipmentStatus.MATCHED && shipment.status !== ShipmentStatus.HANDED_OVER) {
      throw new ForbiddenException(`Cannot confirm handover in status: ${shipment.status}`);
    }

    // Update the appropriate confirmation field
    const updateData: Prisma.ShipmentUpdateInput = {};
    if (isSender) {
      updateData.senderConfirmedHandover = true;
    }
    if (isCourier) {
      updateData.courierConfirmedHandover = true;
    }

    // Check if both will be confirmed after this update
    const senderConfirmed = isSender ? true : shipment.senderConfirmedHandover;
    const courierConfirmed = isCourier ? true : shipment.courierConfirmedHandover;

    if (senderConfirmed && courierConfirmed) {
      // Both confirmed - update status to HANDED_OVER then ON_WAY
      updateData.status = ShipmentStatus.ON_WAY;
      updateData.handoverConfirmedAt = new Date();
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true, verificationStatus: true },
        },
        courier: {
          select: { id: true, firstName: true, lastName: true, avatar: true, verificationStatus: true },
        },
      },
    });

    return {
      shipment: updated,
      confirmations: {
        senderConfirmedHandover: updated.senderConfirmedHandover,
        courierConfirmedHandover: updated.courierConfirmedHandover,
        bothConfirmed: updated.senderConfirmedHandover && updated.courierConfirmedHandover,
      },
      message: senderConfirmed && courierConfirmed
        ? 'Both parties confirmed handover. Package is now on the way!'
        : `${isSender ? 'Sender' : 'Courier'} confirmed handover. Waiting for ${isSender ? 'courier' : 'sender'} confirmation.`,
    };
  }

  /**
   * Confirm delivery - called by either sender or courier
   * When both confirm, status changes to DELIVERED and payment is released
   */
  async confirmDelivery(shipmentId: string, userId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: {
        id: true,
        status: true,
        senderId: true,
        courierId: true,
        senderConfirmedDelivery: true,
        courierConfirmedDelivery: true,
        price: true,
        currency: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Verify user is either sender or courier
    const isSender = shipment.senderId === userId;
    const isCourier = shipment.courierId === userId;

    if (!isSender && !isCourier) {
      throw new ForbiddenException('You are not authorized to confirm this shipment');
    }

    if (!shipment.courierId) {
      throw new ForbiddenException('Cannot confirm delivery - no courier assigned');
    }

    if (shipment.status !== ShipmentStatus.ON_WAY) {
      throw new ForbiddenException(`Cannot confirm delivery in status: ${shipment.status}`);
    }

    // Update the appropriate confirmation field
    const updateData: Prisma.ShipmentUpdateInput = {};
    if (isSender) {
      updateData.senderConfirmedDelivery = true;
    }
    if (isCourier) {
      updateData.courierConfirmedDelivery = true;
    }

    // Check if both will be confirmed after this update
    const senderConfirmed = isSender ? true : shipment.senderConfirmedDelivery;
    const courierConfirmed = isCourier ? true : shipment.courierConfirmedDelivery;

    if (senderConfirmed && courierConfirmed) {
      // Both confirmed - update status to DELIVERED
      updateData.status = ShipmentStatus.DELIVERED;
      updateData.deliveryConfirmedAt = new Date();

      // Release payment to courier
      await this.prisma.transaction.updateMany({
        where: { shipmentId, status: TransactionStatus.HELD },
        data: {
          status: TransactionStatus.RELEASED,
          payeeId: shipment.courierId,
        },
      });
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true, verificationStatus: true },
        },
        courier: {
          select: { id: true, firstName: true, lastName: true, avatar: true, verificationStatus: true },
        },
      },
    });

    return {
      shipment: updated,
      confirmations: {
        senderConfirmedDelivery: updated.senderConfirmedDelivery,
        courierConfirmedDelivery: updated.courierConfirmedDelivery,
        bothConfirmed: updated.senderConfirmedDelivery && updated.courierConfirmedDelivery,
      },
      message: senderConfirmed && courierConfirmed
        ? 'Both parties confirmed delivery. Payment has been released!'
        : `${isSender ? 'Sender' : 'Courier'} confirmed delivery. Waiting for ${isSender ? 'courier' : 'sender'} confirmation.`,
    };
  }
}
