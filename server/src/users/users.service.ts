import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
                isVerified: true,
                country: true,
                city: true,
                joinedAt: true,
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
                status: 'DELIVERED',
            },
        });

        // Get reviews (placeholder - we'll add UserReview model later)
        // For now, return empty reviews
        const reviews: any[] = [];
        const averageRating = 0;
        const totalReviews = 0;

        return {
            ...user,
            stats: {
                shipmentsPosted,
                deliveriesCompleted,
                averageRating,
                totalReviews,
            },
            reviews,
        };
    }
}
