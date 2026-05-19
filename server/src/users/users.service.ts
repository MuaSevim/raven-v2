import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get public profile for a user with stats
     */
    async getPublicProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    verificationStatus: true,
                country: true,
                city: true,
                bio: true,
                joinedAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Get shipments posted count
        const shipmentsPosted = await this.prisma.shipment.count({
            where: { senderId: userId },
        });

        // Get deliveries completed count (as courier)
        const deliveriesCompleted = await this.prisma.shipment.count({
            where: {
                courierId: userId,
                status: ShipmentStatus.DELIVERED,
            },
        });

        // Get reviews
        const reviewsData = await this.prisma.userReview.findMany({
            where: { revieweeId: userId },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalReviews = reviewsData.length;
        const averageRating = totalReviews > 0 
            ? reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
            : 0;

        return {
            ...user,
            stats: {
                shipmentsPosted,
                deliveriesCompleted,
                averageRating: Number(averageRating.toFixed(1)),
                totalReviews,
            },
            reviews: reviewsData,
        };
    }
}
