import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TravelsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, userEmail: string, createTravelDto: CreateTravelDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      if (!userEmail) {
        throw new ForbiddenException('User email is required but was not provided.');
      }
      await this.prisma.user.create({
        data: {
          id: userId,
          email: userEmail,
        },
      });
    }

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
    const where: Prisma.TravelWhereInput = {};

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
    const departureDateFilter: Prisma.DateTimeFilter = {};
    if (filters?.fromDate) {
      departureDateFilter.gte = new Date(filters.fromDate);
    }
    if (filters?.toDate) {
      departureDateFilter.lte = new Date(filters.toDate);
    }

    // Only show future travels (departure date >= today)
    const now = new Date();
    if (departureDateFilter.gte) {
      const gteDate = new Date(departureDateFilter.gte);
      departureDateFilter.gte = new Date(Math.max(gteDate.getTime(), now.getTime()));
    } else {
      departureDateFilter.gte = now;
    }
    where.departureDate = departureDateFilter;

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

    const { departureDate, arrivalDate } = updateTravelDto;
    return this.prisma.travel.update({
      where: { id },
      data: {
        ...updateTravelDto,
        departureDate: departureDate
          ? new Date(departureDate)
          : undefined,
        arrivalDate: arrivalDate
          ? new Date(arrivalDate)
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
