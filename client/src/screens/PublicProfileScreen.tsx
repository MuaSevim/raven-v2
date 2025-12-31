import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BadgeCheck, Star, Package, Plane, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { API_URL } from '../config';

interface UserProfile {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isVerified: boolean;
    country: string | null;
    city: string | null;
    joinedAt: string;
    stats: {
        shipmentsPosted: number;
        deliveriesCompleted: number;
        averageRating: number;
        totalReviews: number;
    };
    reviews: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        reviewer: {
            firstName: string | null;
            lastName: string | null;
            avatar: string | null;
        };
    }[];
}

export default function PublicProfileScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { user } = useAuthStore();
    const userId = route.params?.userId;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                if (!user || !userId) return;

                try {
                    const token = await user.getIdToken();
                    const response = await fetch(`${API_URL}/users/${userId}/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setProfile(data);
                    }
                } catch (err) {
                    console.error('Error fetching profile:', err);
                } finally {
                    setLoading(false);
                }
            };

            fetchProfile();
        }, [user, userId])
    );

    const fullName = profile
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User'
        : 'User';

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={16}
                    color={i <= rating ? '#F59E0B' : colors.border}
                    fill={i <= rating ? '#F59E0B' : 'transparent'}
                />
            );
        }
        return stars;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.textPrimary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Profile not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {profile.avatar ? (
                            <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {fullName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.nameRow}>
                        <Text style={styles.userName}>{fullName}</Text>
                        {profile.isVerified && (
                            <BadgeCheck size={20} color={colors.textPrimary} fill={colors.background} />
                        )}
                    </View>

                    {(profile.city || profile.country) && (
                        <View style={styles.locationRow}>
                            <MapPin size={14} color={colors.textSecondary} />
                            <Text style={styles.locationText}>
                                {[profile.city, profile.country].filter(Boolean).join(', ')}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.memberSince}>
                        Member since {formatDate(profile.joinedAt)}
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsSection}>
                    <View style={styles.statCard}>
                        <Package size={24} color={colors.textPrimary} strokeWidth={1.5} />
                        <Text style={styles.statNumber}>{profile.stats.shipmentsPosted}</Text>
                        <Text style={styles.statLabel}>Packages Sent</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Plane size={24} color={colors.textPrimary} strokeWidth={1.5} />
                        <Text style={styles.statNumber}>{profile.stats.deliveriesCompleted}</Text>
                        <Text style={styles.statLabel}>Deliveries Made</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Star size={24} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.statNumber}>
                            {profile.stats.averageRating > 0 ? profile.stats.averageRating.toFixed(1) : '—'}
                        </Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Reviews */}
                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>
                        Reviews ({profile.stats.totalReviews})
                    </Text>

                    {profile.reviews.length === 0 ? (
                        <View style={styles.emptyReviews}>
                            <Text style={styles.emptyText}>No reviews yet</Text>
                        </View>
                    ) : (
                        profile.reviews.map((review) => {
                            const reviewerName = `${review.reviewer.firstName || ''} ${review.reviewer.lastName || ''}`.trim() || 'Anonymous';
                            return (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewerInfo}>
                                            {review.reviewer.avatar ? (
                                                <Image source={{ uri: review.reviewer.avatar }} style={styles.reviewerAvatar} />
                                            ) : (
                                                <View style={styles.reviewerAvatarPlaceholder}>
                                                    <Text style={styles.reviewerAvatarText}>
                                                        {reviewerName.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <Text style={styles.reviewerName}>{reviewerName}</Text>
                                        </View>
                                        <View style={styles.ratingRow}>{renderStars(review.rating)}</View>
                                    </View>
                                    {review.comment && (
                                        <Text style={styles.reviewComment}>{review.comment}</Text>
                                    )}
                                    <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    avatarContainer: {
        marginBottom: spacing.md,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 40,
        color: colors.textInverse,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    userName: {
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.fontSize.xl,
        color: colors.textPrimary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    locationText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    memberSince: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.sm,
    },
    statsSection: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
    },
    statNumber: {
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.fontSize.xl,
        color: colors.textPrimary,
    },
    statLabel: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    reviewsSection: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    emptyReviews: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    reviewCard: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    reviewerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    reviewerAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerAvatarText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 12,
        color: colors.textInverse,
    },
    reviewerName: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textPrimary,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
    },
    reviewComment: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textPrimary,
        lineHeight: 20,
    },
    reviewDate: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.sm,
    },
});
