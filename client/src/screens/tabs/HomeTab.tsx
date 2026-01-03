import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package,
  Plane,
  MessageCircle,
  Globe,
  MapPin,
  TrendingUp,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { ActivityItem, ActivitySkeleton } from '../../components/home';

// =============================================================================
// TYPES
// =============================================================================

interface ActivityData {
  id: string;
  shipmentId: string;
  type: 'shipment' | 'transaction' | 'offer';
  status: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  ownerName: string;
  isOwner: boolean;
  createdAt: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = { EUR: '€', GBP: '£', SEK: 'kr', USD: '$' };
  return symbols[currency] || '$';
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HomeTab() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [activeItems, setActiveItems] = useState<ActivityData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [shipmentsRes, deliveringRes, transactionsRes, offersRes, unreadRes, profileRes] = await Promise.all([
        fetch(`${API_URL}/shipments/my/sent`, { headers }),
        fetch(`${API_URL}/shipments/my/delivering`, { headers }),
        fetch(`${API_URL}/payments/transactions`, { headers }),
        fetch(`${API_URL}/shipments/my/offers`, { headers }),
        fetch(`${API_URL}/conversations/unread`, { headers }),
        fetch(`${API_URL}/auth/me`, { headers }),
      ]);

      // Process shipments
      const shipments = shipmentsRes.ok ? await shipmentsRes.json() : [];

      // Calculate 2 days ago for filtering recently delivered
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const shipmentItems: ActivityData[] = shipments
        .filter((s: any) => {
          // Always exclude CANCELLED
          if (s.status === 'CANCELLED') return false;

          // Include DELIVERED if delivered within last 2 days
          if (s.status === 'DELIVERED') {
            const deliveredAt = s.deliveryConfirmedAt ? new Date(s.deliveryConfirmedAt) : new Date(s.updatedAt);
            return deliveredAt >= twoDaysAgo;
          }

          // Include all other active statuses
          return true;
        })
        .map((s: any) => ({
          id: s.id,
          shipmentId: s.id,
          type: 'shipment' as const,
          status: s.status,
          price: s.price,
          currency: s.currency,
          origin: s.originCity,
          destination: s.destCity,
          ownerName: `${s.sender?.firstName || ''} ${s.sender?.lastName || ''}`.trim() || 'You',
          isOwner: true,
          createdAt: s.createdAt,
        }));

      // Process courier deliveries (shipments where user is courier)
      const delivering = deliveringRes.ok ? await deliveringRes.json() : [];
      const deliveringItems: ActivityData[] = delivering
        .filter((s: any) => {
          // Always exclude CANCELLED
          if (s.status === 'CANCELLED') return false;

          // Include DELIVERED if delivered within last 2 days
          if (s.status === 'DELIVERED') {
            const deliveredAt = s.deliveryConfirmedAt ? new Date(s.deliveryConfirmedAt) : new Date(s.updatedAt);
            return deliveredAt >= twoDaysAgo;
          }

          // Include all other active statuses
          return true;
        })
        .map((s: any) => ({
          id: `courier-${s.id}`,
          shipmentId: s.id,
          type: 'shipment' as const,
          status: s.status,
          price: s.price,
          currency: s.currency,
          origin: s.originCity,
          destination: s.destCity,
          ownerName: `${s.sender?.firstName || ''} ${s.sender?.lastName || ''}`.trim(),
          isOwner: false, // User is courier, not owner
          createdAt: s.createdAt,
        }));

      // Process transactions
      const transactions = transactionsRes.ok ? await transactionsRes.json() : [];
      const transactionItems: ActivityData[] = transactions
        .filter((t: any) => t.status === 'HELD' || t.status === 'RELEASED')
        .map((t: any) => ({
          id: t.id,
          shipmentId: t.shipment?.id,
          type: 'transaction' as const,
          status: t.status === 'RELEASED' ? 'DELIVERED' : 'ON_WAY',
          price: t.amount,
          currency: t.currency,
          origin: t.shipment?.originCity || 'Unknown',
          destination: t.shipment?.destCity || 'Unknown',
          ownerName: `${t.shipment?.sender?.firstName || ''} ${t.shipment?.sender?.lastName || ''}`.trim(),
          isOwner: t.shipment?.sender?.id === user.uid,
          createdAt: t.createdAt,
        }));

      // Process offers - shipments where user made an offer
      const offers = offersRes.ok ? await offersRes.json() : [];
      const offerItems: ActivityData[] = offers
        .filter((o: any) => o.status === 'PENDING' && o.shipment?.status === 'OPEN')
        .map((o: any) => ({
          id: o.id,
          shipmentId: o.shipment?.id,
          type: 'offer' as const,
          status: 'OFFER_MADE',
          price: o.shipment?.price,
          currency: o.shipment?.currency,
          origin: o.shipment?.originCity || 'Unknown',
          destination: o.shipment?.destCity || 'Unknown',
          ownerName: `${o.shipment?.sender?.firstName || ''} ${o.shipment?.sender?.lastName || ''}`.trim(),
          isOwner: false,
          createdAt: o.createdAt,
        }));

      // Merge and sort by creation date (newest first)
      // Use a Set to deduplicate by shipmentId (in case same shipment appears in multiple lists)
      const seenShipmentIds = new Set<string>();
      const allItems = [...shipmentItems, ...deliveringItems, ...transactionItems, ...offerItems]
        .filter(item => {
          if (item.shipmentId && seenShipmentIds.has(item.shipmentId)) {
            return false;
          }
          if (item.shipmentId) {
            seenShipmentIds.add(item.shipmentId);
          }
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setActiveItems(allItems);

      // Unread count
      if (unreadRes.ok) {
        const data = await unreadRes.json();
        setUnreadCount(data.unreadCount || data.count || 0);
      }


    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textPrimary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header: Logo + Avatar + Inbox */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Raven</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
            </TouchableOpacity>
            <TouchableOpacity style={styles.inboxButton} onPress={() => navigation.navigate('Inbox')}>
              <MessageCircle size={22} color={colors.textPrimary} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>


        {/* Explore Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <TouchableOpacity
            style={styles.ctaCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SetRoute')}
          >
            <View style={{ marginRight: spacing.md }}>
              <Package size={28} color={colors.textPrimary} strokeWidth={1.5} />
            </View>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Deliver a package</Text>
              <Text style={styles.ctaSubtitle}>Match with a trusted passenger</Text>
            </View>
          </TouchableOpacity>
        </View>


        {/* Top Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Routes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routesScroll}>
            {[
              { from: 'Berlin', to: 'Istanbul' },
              { from: 'New York', to: 'London' },
              { from: 'Paris', to: 'Dubai' },
              { from: 'Tokyo', to: 'Seoul' },
            ].map((route, i) => (
              <View key={i} style={styles.routeChip}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.routeText}>{route.from}</Text>
                <Plane size={10} color={colors.textTertiary} />
                <Text style={styles.routeText}>{route.to}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Your Activities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Activities</Text>
            {!loading && activeItems.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <>
              <ActivitySkeleton />
              <ActivitySkeleton />
            </>
          ) : activeItems.length > 0 ? (
            activeItems.slice(0, 3).map((item) => (
              <ActivityItem
                key={item.id}
                origin={item.origin}
                destination={item.destination}
                status={item.status}
                price={`${getCurrencySymbol(item.currency)}${item.price}`}
                ownerName={item.isOwner ? 'Your Delivery' : item.ownerName}
                onPress={() => {
                  if (item.status === 'OPEN' || item.status === 'OFFER_MADE') {
                    navigation.navigate('ShipmentDetail', { shipmentId: item.shipmentId });
                  } else {
                    navigation.navigate('ActivityDetail', { shipmentId: item.shipmentId });
                  }
                }}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No active deliveries</Text>
            </View>
          )}
        </View>

        {/* Platform Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Insights</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Globe size={18} color={colors.textPrimary} strokeWidth={1.5} />
              <Text style={styles.statValue}>1,240+</Text>
              <Text style={styles.statLabel}>Active Routes</Text>
            </View>
            <View style={styles.statCard}>
              <Package size={18} color={colors.textPrimary} strokeWidth={1.5} />
              <Text style={styles.statValue}>450</Text>
              <Text style={styles.statLabel}>Deliveries Today</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={18} color={colors.textPrimary} strokeWidth={1.5} />
              <Text style={styles.statValue}>99.2%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarButton: {
    width: 40,
    height: 40,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: '#FFFFFF',
  },
  inboxButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: '#fff',
  },
  // Sections
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  seeAll: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  // CTA Card
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  ctaSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // How It Works
  howItWorksGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  howItWorksCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  howItWorksLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  howItWorksDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  // Routes
  routesScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  routeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  // Bottom
  bottomPadding: {
    height: spacing.xl * 2,
  },
});
