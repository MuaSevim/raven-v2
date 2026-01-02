import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, MapPin, ArrowRight, Clock, CheckCircle, MessageCircle } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { API_URL } from '../config';

interface ActivityItem {
    id: string;
    type: 'shipment' | 'offer' | 'transaction';
    title: string;
    status: string;
    price: number;
    currency: string;
    origin: string;
    destination: string;
    date: string;
    meta?: any;
}

function getCurrencySymbol(currency: string) {
    switch (currency) {
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'SEK': return 'kr';
        default: return '$';
    }
}

export default function ActivitiesScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchActivities = async () => {
                if (!user) return;

                try {
                    const token = await user.getIdToken();
                    const headers = { 'Authorization': `Bearer ${token}` };

                    // Fetch all data sources
                    const [shipmentsRes, offersRes, transactionsRes] = await Promise.all([
                        fetch(`${API_URL}/shipments/my/sent`, { headers }),
                        fetch(`${API_URL}/shipments/my/offers`, { headers }),
                        fetch(`${API_URL}/payments/transactions`, { headers }),
                    ]);

                    const allActivities: ActivityItem[] = [];

                    // Process my shipments
                    if (shipmentsRes.ok) {
                        const shipments = await shipmentsRes.json();
                        shipments.forEach((s: any) => {
                            allActivities.push({
                                id: s.id,
                                type: 'shipment',
                                title: s.content,
                                status: s.status,
                                price: s.price,
                                currency: s.currency,
                                origin: s.originCity,
                                destination: s.destCity,
                                date: s.createdAt,
                                meta: { offersCount: s._count?.offers || 0 },
                            });
                        });
                    }

                    // Process offers I made
                    if (offersRes.ok) {
                        const offers = await offersRes.json();
                        offers.forEach((o: any) => {
                            allActivities.push({
                                id: o.id,
                                type: 'offer',
                                title: o.shipment?.content || 'Offer',
                                status: o.status,
                                price: o.proposedPrice || o.shipment?.price || 0,
                                currency: o.shipment?.currency || 'USD',
                                origin: o.shipment?.originCity || '',
                                destination: o.shipment?.destCity || '',
                                date: o.createdAt,
                                meta: { shipmentId: o.shipmentId, ownerId: o.shipment?.senderId },
                            });
                        });
                    }

                    // Process transactions
                    if (transactionsRes.ok) {
                        const transactions = await transactionsRes.json();
                        transactions.forEach((t: any) => {
                            allActivities.push({
                                id: t.id,
                                type: 'transaction',
                                title: t.shipment?.content || 'Delivery',
                                status: t.status,
                                price: t.amount,
                                currency: t.currency,
                                origin: t.shipment?.originCity || '',
                                destination: t.shipment?.destCity || '',
                                date: t.createdAt,
                                meta: { role: t.payerId === user.uid ? 'sender' : 'courier', shipmentId: t.shipment?.id },
                            });
                        });
                    }

                    // Sort by date
                    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setActivities(allActivities);
                } catch (err) {
                    console.error('Error fetching activities:', err);
                } finally {
                    setLoading(false);
                }
            };

            fetchActivities();
        }, [user])
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return '#22C55E';
            case 'PENDING': return '#8B5CF6';
            case 'MATCHED': return '#3B82F6';
            case 'ON_WAY': return '#8B5CF6';
            case 'DELIVERED': return '#10B981';
            case 'ACCEPTED': return '#22C55E';
            case 'OFFER_MADE': return '#8B5CF6';
            default: return colors.textSecondary;
        }
    };

    const getStatusLabel = (item: ActivityItem) => {
        if (item.type === 'shipment' && item.status === 'OPEN') {
            return `${item.meta?.offersCount || 0} Offers`;
        }
        if (item.type === 'offer') {
            return item.status === 'PENDING' ? 'Offer Made' : item.status;
        }
        return item.status.replace('_', ' ');
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'offer': return <MessageCircle size={16} color={colors.textSecondary} />;
            case 'transaction': return <CheckCircle size={16} color={colors.textSecondary} />;
            default: return <Package size={16} color={colors.textSecondary} />;
        }
    };

    const handleItemPress = (item: ActivityItem) => {
        if (item.type === 'shipment') {
            if (item.status === 'OPEN') {
                navigation.navigate('ShipmentDetail', { shipmentId: item.id });
            } else {
                navigation.navigate('ActivityDetail', { shipmentId: item.id });
            }
        } else if (item.type === 'offer' && item.meta?.shipmentId) {
            // For pending offers, go to shipment detail which shows "You made an offer"
            if (item.status === 'PENDING') {
                navigation.navigate('ShipmentDetail', { shipmentId: item.meta.shipmentId });
            } else {
                // For accepted/rejected offers, go to activity detail or chat
                navigation.navigate('Chat', {
                    shipmentId: item.meta.shipmentId,
                    recipientId: item.meta.ownerId,
                });
            }
        } else if (item.type === 'transaction' && item.meta?.shipmentId) {
            navigation.navigate('ActivityDetail', { shipmentId: item.meta.shipmentId });
        }
    };

    const renderItem = ({ item }: { item: ActivityItem }) => (
        <TouchableOpacity
            style={styles.activityCard}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <View style={styles.typeContainer}>
                    {getTypeIcon(item.type)}
                    <Text style={styles.typeLabel}>
                        {item.type === 'shipment' ? 'Your Shipment' :
                            item.type === 'offer' ? 'Your Offer' : 'Delivery'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Clock size={10} color={getStatusColor(item.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item)}
                    </Text>
                </View>
            </View>

            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

            <View style={styles.routeRow}>
                <View style={styles.location}>
                    <MapPin size={12} color={colors.textTertiary} />
                    <Text style={styles.cityText}>{item.origin}</Text>
                </View>
                <ArrowRight size={14} color={colors.textTertiary} />
                <View style={styles.location}>
                    <MapPin size={12} color={colors.textTertiary} />
                    <Text style={styles.cityText}>{item.destination}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.price}>
                    {getCurrencySymbol(item.currency)}{item.price}
                </Text>
                <Text style={styles.date}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Activities</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.textPrimary} />
                </View>
            ) : activities.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Package size={48} color={colors.textTertiary} strokeWidth={1} />
                    <Text style={styles.emptyTitle}>No activities yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Your shipments, offers, and deliveries will appear here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl * 2,
    },
    activityCard: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    typeLabel: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.xs,
        color: colors.textSecondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: 10,
    },
    title: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    location: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cityText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    date: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textTertiary,
    },
});
