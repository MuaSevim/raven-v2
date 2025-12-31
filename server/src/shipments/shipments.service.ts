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
    await this.prisma.user.upsert({
      where: { id: senderId },
      update: {
        // Update the user's name if provided and not already set
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      create: {
        id: senderId,
        email: senderEmail || `${senderId}@placeholder.com`,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'SENDER',
      },
    });

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

    // Only sender can cancel, only courier can update to IN_TRANSIT or DELIVERED
    if (status === 'CANCELLED' && shipment.senderId !== userId) {
      throw new ForbiddenException('Only the sender can cancel this shipment');
    }

    if (['IN_TRANSIT', 'DELIVERED'].includes(status) && shipment.courierId !== userId) {
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

    return this.prisma.shipmentOffer.create({
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
}
