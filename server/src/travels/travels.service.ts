import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';

@Injectable()
export class TravelsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, userEmail: string, createTravelDto: CreateTravelDto) {
    // Ensure user exists in database (upsert if not)
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: userEmail || `${userId}@placeholder.com`,
      },
    });

    return this.prisma.travel.create({
      data: {
        ...createTravelDto,
        departureDate: new Date(createTravelDto.departureDate),
        arrivalDate: createTravelDto.arrivalDate
          ? new Date(createTravelDto.arrivalDate)
          : null,
        travelerId: userId,
      },
      include: {
        traveler: {
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
      },
    });
  }

  async findAll(filters?: {
    status?: string;
    fromCity?: string;
    toCity?: string;
    minWeight?: number;
    maxWeight?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    // Default to ACTIVE travels
    where.status = filters?.status || 'ACTIVE';

    if (filters?.fromCity) {
      where.fromCity = { contains: filters.fromCity, mode: 'insensitive' };
    }
    if (filters?.toCity) {
      where.toCity = { contains: filters.toCity, mode: 'insensitive' };
    }
    if (filters?.minWeight || filters?.maxWeight) {
      where.availableWeight = {};
      if (filters.minWeight) where.availableWeight.gte = filters.minWeight;
      if (filters.maxWeight) where.availableWeight.lte = filters.maxWeight;
    }
    if (filters?.fromDate) {
      where.departureDate = { ...where.departureDate, gte: new Date(filters.fromDate) };
    }
    if (filters?.toDate) {
      where.departureDate = { ...where.departureDate, lte: new Date(filters.toDate) };
    }

    // Only show future travels (departure date >= today)
    where.departureDate = { ...where.departureDate, gte: new Date() };

    return this.prisma.travel.findMany({
      where,
      include: {
        traveler: {
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
      },
      orderBy: { departureDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const travel = await this.prisma.travel.findUnique({
      where: { id },
      include: {
        traveler: {
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
      },
    });

    if (!travel) {
      throw new NotFoundException(`Travel with ID ${id} not found`);
    }

    return travel;
  }

  async findByUser(userId: string) {
    return this.prisma.travel.findMany({
      where: { travelerId: userId },
      include: {
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: { departureDate: 'desc' },
    });
  }

  async update(id: string, userId: string, updateTravelDto: UpdateTravelDto) {
    const travel = await this.prisma.travel.findUnique({
      where: { id },
    });

    if (!travel) {
      throw new NotFoundException(`Travel with ID ${id} not found`);
    }

    if (travel.travelerId !== userId) {
      throw new ForbiddenException('You can only update your own travels');
    }

    const dto = updateTravelDto as any;
    return this.prisma.travel.update({
      where: { id },
      data: {
        ...updateTravelDto,
        departureDate: dto.departureDate
          ? new Date(dto.departureDate)
          : undefined,
        arrivalDate: dto.arrivalDate
          ? new Date(dto.arrivalDate)
          : undefined,
      },
      include: {
        traveler: {
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

  async remove(id: string, userId: string) {
    const travel = await this.prisma.travel.findUnique({
      where: { id },
    });

    if (!travel) {
      throw new NotFoundException(`Travel with ID ${id} not found`);
    }

    if (travel.travelerId !== userId) {
      throw new ForbiddenException('You can only delete your own travels');
    }

    return this.prisma.travel.delete({
      where: { id },
    });
  }

  async cancel(id: string, userId: string) {
    const travel = await this.prisma.travel.findUnique({
      where: { id },
    });

    if (!travel) {
      throw new NotFoundException(`Travel with ID ${id} not found`);
    }

    if (travel.travelerId !== userId) {
      throw new ForbiddenException('You can only cancel your own travels');
    }

    return this.prisma.travel.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
