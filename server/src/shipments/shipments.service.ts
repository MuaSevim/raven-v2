import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) { }

  async create(senderId: string, senderEmail: string, createShipmentDto: CreateShipmentDto) {
    // Split the full name into firstName and lastName
    const fullName = createShipmentDto.senderFullName || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Ensure user exists in database (upsert if not)
    const existingUser = await this.prisma.user.findUnique({ where: { id: senderId } });
    
    if (!existingUser) {
      await this.prisma.user.create({
        data: {
          id: senderId,
          email: senderEmail || `${senderId}@placeholder.com`,
          firstName: firstName || null,
          lastName: lastName || null,
        },
      });
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

    return this.prisma.shipment.create({
      data: {
        ...createShipmentDto,
        dateStart: new Date(createShipmentDto.dateStart),
        dateEnd: new Date(createShipmentDto.dateEnd),
        senderId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
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
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
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
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
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
            isVerified: true,
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
            isVerified: true,
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
                isVerified: true,
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

  async findByUser(userId: string, role: 'sender' | 'courier') {
    const where = role === 'sender'
      ? { senderId: userId }
      : { courierId: userId };

    return this.prisma.shipment.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
        courier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
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
  async findOffersByUser(userId: string) {
    return this.prisma.shipmentOffer.findMany({
      where: { courierId: userId },
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
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, userId: string, status: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Only sender can cancel, only courier can update to ON_WAY or DELIVERED
    if (status === 'CANCELLED' && shipment.senderId !== userId) {
      throw new ForbiddenException('Only the sender can cancel this shipment');
    }

    if (['ON_WAY', 'DELIVERED'].includes(status) && shipment.courierId !== userId) {
      throw new ForbiddenException('Only the assigned courier can update delivery status');
    }

    return this.prisma.shipment.update({
      where: { id },
      data: { status },
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

    if (shipment.status !== 'OPEN') {
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
            isVerified: true,
          },
        },
      },
    });

    // Get or create conversation and inject offer message
    const [user1Id, user2Id] = [courierId, shipment.senderId].sort();
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        user1Id_user2Id_shipmentId: { user1Id, user2Id, shipmentId },
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
        type: 'OFFER',
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

  async acceptOffer(offerId: string, senderId: string) {
    const offer = await this.prisma.shipmentOffer.findUnique({
      where: { id: offerId },
      include: { shipment: true },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.shipment.senderId !== senderId) {
      throw new ForbiddenException('Only the sender can accept offers');
    }

    if (offer.shipment.status !== 'OPEN') {
      throw new ForbiddenException('This shipment is no longer open');
    }

    // Accept the offer and update shipment
    await this.prisma.$transaction([
      // Update the offer status
      this.prisma.shipmentOffer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED' },
      }),
      // Reject all other offers
      this.prisma.shipmentOffer.updateMany({
        where: { shipmentId: offer.shipmentId, id: { not: offerId } },
        data: { status: 'REJECTED' },
      }),
      // Update shipment with courier
      this.prisma.shipment.update({
        where: { id: offer.shipmentId },
        data: {
          courierId: offer.courierId,
          status: 'MATCHED',
        },
      }),
    ]);

    // Update the conversation status to MATCHED
    const [user1Id, user2Id] = [offer.courierId, senderId].sort();
    await this.prisma.conversation.updateMany({
      where: {
        shipmentId: offer.shipmentId,
        user1Id,
        user2Id,
      },
      data: {
        status: 'MATCHED',
      },
    });

    return this.findOne(offer.shipmentId);
  }

  async rejectOffer(offerId: string, senderId: string) {
    const offer = await this.prisma.shipmentOffer.findUnique({
      where: { id: offerId },
      include: { shipment: true },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.shipment.senderId !== senderId) {
      throw new ForbiddenException('Only the sender can reject offers');
    }

    return this.prisma.shipmentOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED' },
    });
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

    if (shipment.status !== 'MATCHED' && shipment.status !== 'HANDED_OVER') {
      throw new ForbiddenException(`Cannot confirm handover in status: ${shipment.status}`);
    }

    // Update the appropriate confirmation field
    const updateData: any = {};
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
      updateData.status = 'ON_WAY';
      updateData.handoverConfirmedAt = new Date();
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        courier: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
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

    if (shipment.status !== 'ON_WAY') {
      throw new ForbiddenException(`Cannot confirm delivery in status: ${shipment.status}`);
    }

    // Update the appropriate confirmation field
    const updateData: any = {};
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
      updateData.status = 'DELIVERED';
      updateData.deliveryConfirmedAt = new Date();

      // Release payment to courier
      await this.prisma.transaction.updateMany({
        where: { shipmentId, status: 'HELD' },
        data: {
          status: 'RELEASED',
          payeeId: shipment.courierId,
        },
      });
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        courier: {
          select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true },
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
