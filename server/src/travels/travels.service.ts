import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { Prisma, TravelStatus } from '@prisma/client';

@Injectable()
export class TravelsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, userEmail: string, createTravelDto: CreateTravelDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException('User not found. Please complete registration first.');
    }

    if (existingUser.verificationStatus !== 'verified') {
      throw new ForbiddenException('Please verify your account before adding a flight.');
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
            verificationStatus: true,
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
    take?: number;
    skip?: number;
  }) {
    const where: Prisma.TravelWhereInput = {};

    // Default to ACTIVE travels
    where.status = (filters?.status as TravelStatus) || TravelStatus.ACTIVE;

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
    if (filters?.fromDate || filters?.toDate) {
      where.departureDate = {};
      if (filters.fromDate) {
        where.departureDate.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.departureDate.lte = new Date(filters.toDate);
      }
    } else {
      // Only show future travels (departure date >= today)
      where.departureDate = { gte: new Date() };
    }

    return this.prisma.travel.findMany({
      where,
      take: filters?.take ?? 50,
      skip: filters?.skip ?? 0,
      include: {
        traveler: {
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
            verificationStatus: true,
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

  async findByUser(userId: string, take = 50, skip = 0) {
    return this.prisma.travel.findMany({
      where: { travelerId: userId },
      take,
      skip,
      include: {
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            verificationStatus: true,
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
            verificationStatus: true,
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
      data: { status: TravelStatus.CANCELLED },
    });
  }
}
