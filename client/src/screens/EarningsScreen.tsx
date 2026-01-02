import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, TrendingUp, DollarSign, Package, Star, Calendar } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { colors, typography, spacing, borderRadius } from '../theme';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface EarningsData {
    totalEarnings: number;
    totalDeliveries: number;
    averageRating: number;
    monthlyEarnings: { month: string; amount: number }[];
    recentDeliveries: {
        id: string;
        route: string;
        amount: number;
        date: string;
        status: string;
    }[];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function EarningsScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
        // For MVP/Demo, using test data
        // In production, this would fetch from: `${API_URL}/earnings`

        setTimeout(() => {
            setEarnings({
                totalEarnings: 2847.50,
                totalDeliveries: 23,
                averageRating: 4.8,
                monthlyEarnings: [
                    { month: 'Aug', amount: 420 },
                    { month: 'Sep', amount: 680 },
                    { month: 'Oct', amount: 520 },
                    { month: 'Nov', amount: 790 },
                    { month: 'Dec', amount: 437.50 },
                ],
                recentDeliveries: [
                    { id: '1', route: 'NYC → LA', amount: 125.00, date: '2 days ago', status: 'DELIVERED' },
                    { id: '2', route: 'London → Paris', amount: 89.50, date: '5 days ago', status: 'DELIVERED' },
                    { id: '3', route: 'Tokyo → Seoul', amount: 156.00, date: '1 week ago', status: 'DELIVERED' },
                    { id: '4', route: 'Berlin → Rome', amount: 67.00, date: '2 weeks ago', status: 'DELIVERED' },
                ],
            });
            setLoading(false);
        }, 800);
    };

    const maxEarning = earnings ? Math.max(...earnings.monthlyEarnings.map(e => e.amount)) : 0;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.textPrimary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!earnings) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Earnings</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No earnings data available</Text>
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
                <Text style={styles.headerTitle}>Statistics</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Total Earnings Card */}
                <View style={styles.totalCard}>
                    <View style={styles.totalHeader}>
                        <Text style={styles.totalLabel}>Total Earnings</Text>
                        {/* <View style={styles.trendBadge}>
                            <TrendingUp size={14} color="#22C55E" />
                            <Text style={styles.trendText}>+12%</Text>
                        </View> */}
                    </View>
                    <Text style={styles.totalAmount}>${earnings.totalEarnings.toFixed(2)}</Text>
                    <Text style={styles.totalSubtext}>Across {earnings.totalDeliveries} deliveries</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Package size={20} color={colors.textPrimary} />
                        </View>
                        <Text style={styles.statValue}>{earnings.totalDeliveries}</Text>
                        <Text style={styles.statLabel}>Deliveries</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Star size={20} color="#FFA000" />
                        </View>
                        <Text style={styles.statValue}>{earnings.averageRating.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Avg Rating</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <DollarSign size={20} color="#22C55E" />
                        </View>
                        <Text style={styles.statValue}>${(earnings.totalEarnings / earnings.totalDeliveries).toFixed(0)}</Text>
                        <Text style={styles.statLabel}>Per Delivery</Text>
                    </View>
                </View>

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    {(['week', 'month', 'year'] as const).map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Earnings Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Monthly Earnings</Text>
                    <View style={styles.chart}>
                        {earnings.monthlyEarnings.map((item, index) => {
                            const barHeight = (item.amount / maxEarning) * 150;
                            return (
                                <View key={index} style={styles.chartBar}>
                                    <View style={styles.barContainer}>
                                        <Text style={styles.barValue}>${item.amount}</Text>
                                        <View style={[styles.bar, { height: barHeight }]} />
                                    </View>
                                    <Text style={styles.barLabel}>{item.month}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Recent Deliveries */}
                <View style={styles.recentCard}>
                    <Text style={styles.recentTitle}>Recent Deliveries</Text>
                    {earnings.recentDeliveries.map((delivery) => (
                        <View key={delivery.id} style={styles.deliveryItem}>
                            <View style={styles.deliveryInfo}>
                                <Text style={styles.deliveryRoute}>{delivery.route}</Text>
                                <Text style={styles.deliveryDate}>{delivery.date}</Text>
                            </View>
                            <View style={styles.deliveryRight}>
                                <Text style={styles.deliveryAmount}>${delivery.amount.toFixed(2)}</Text>
                                <View style={styles.deliveryStatus}>
                                    <Text style={styles.deliveryStatusText}>{delivery.status}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Platform Fee Info */}
                <View style={styles.infoCard}>
                    <Calendar size={20} color={colors.textSecondary} />
                    <View style={styles.infoText}>
                        <Text style={styles.infoTitle}>Platform Fee</Text>
                        <Text style={styles.infoSubtext}>Raven takes 15% platform fee on all deliveries</Text>
                    </View>
                </View>

                <View style={styles.bottomPadding} />
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
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    totalCard: {
        backgroundColor: colors.textPrimary,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    totalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    totalLabel: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textInverse,
        opacity: 0.8,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    trendText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.xs,
        color: '#22C55E',
    },
    totalAmount: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 48,
        color: colors.textInverse,
        marginBottom: spacing.xs,
    },
    totalSubtext: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textInverse,
        opacity: 0.7,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statValue: {
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.fontSize.xl,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    statLabel: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textSecondary,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: 4,
        marginBottom: spacing.lg,
    },
    periodButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    periodButtonActive: {
        backgroundColor: colors.textPrimary,
    },
    periodButtonText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    periodButtonTextActive: {
        color: colors.textInverse,
    },
    chartCard: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    chartTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 200,
    },
    chartBar: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 170,
    },
    barValue: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.xs,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    bar: {
        width: 32,
        backgroundColor: colors.textPrimary,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        minHeight: 20,
    },
    barLabel: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    recentCard: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    recentTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    deliveryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    deliveryInfo: {
        flex: 1,
    },
    deliveryRoute: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    deliveryDate: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textSecondary,
    },
    deliveryRight: {
        alignItems: 'flex-end',
    },
    deliveryAmount: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    deliveryStatus: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    deliveryStatusText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.xs,
        color: '#4CAF50',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    infoSubtext: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textSecondary,
    },
    bottomPadding: {
        height: spacing.xl * 2,
    },
});
