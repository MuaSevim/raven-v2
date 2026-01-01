import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Package, ArrowRight } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { ActivityHeader, ActivityItem, ActivitySkeleton } from '../../components/home';

// Types
interface ActiveItem {
  id: string;
  type: 'shipment' | 'offer' | 'transaction';
  status: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  date: string;
}

export default function HomeTab() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch all active items
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!user) {
          setLoading(false);
          return;
        }

        try {
          const token = await user.getIdToken();
          const headers = { 'Authorization': `Bearer ${token}` };

          // Parallel fetch for better performance
          const [shipmentsRes, transactionsRes, unreadRes] = await Promise.all([
            fetch(`${API_URL}/shipments/my/sent`, { headers }),
            fetch(`${API_URL}/payments/transactions`, { headers }),
            fetch(`${API_URL}/conversations/unread`, { headers }),
          ]);

          // Process shipments
          const shipments = shipmentsRes.ok ? await shipmentsRes.json() : [];
          const myActiveShipments = shipments
            .filter((s: any) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED')
            .map((s: any) => ({
              id: s.id,
              type: 'shipment' as const,
              status: s.status,
              price: s.price,
              currency: s.currency,
              origin: s.originCity,
              destination: s.destCity,
              date: s.createdAt,
            }));

          // Process transactions
          const transactions = transactionsRes.ok ? await transactionsRes.json() : [];
          const myTransactions = transactions
            .filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'FAILED')
            .map((t: any) => ({
              id: t.id,
              type: 'transaction' as const,
              status: 'IN_TRANSIT',
              price: t.amount,
              currency: t.currency,
              origin: t.shipment?.originCity || 'Unknown',
              destination: t.shipment?.destCity || 'Unknown',
              date: t.createdAt,
            }));

          // Merge and sort by date
          const allItems = [...myActiveShipments, ...myTransactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setActiveItems(allItems);

          // Process unread count
          if (unreadRes.ok) {
            const unreadData = await unreadRes.json();
            setUnreadCount(unreadData.unreadCount || 0);
          }
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user])
  );

  const handleItemPress = (item: ActiveItem) => {
    if (item.type === 'shipment') {
      navigation.navigate('ShipmentDetail', { shipmentId: item.id });
    } else if (item.type === 'transaction') {
      navigation.navigate('DeliveryTracking', { transactionId: item.id });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Activities Section */}
        <View style={styles.section}>
          <ActivityHeader
            title="Your Activities"
            unreadCount={unreadCount}
            onInboxPress={() => navigation.navigate('Inbox')}
            onSeeAllPress={() => navigation.navigate('Activities')}
            showSeeAll={!loading && activeItems.length > 3}
          />

          {/* Content Based on State */}
          {loading ? (
            <>
              <ActivitySkeleton />
              <ActivitySkeleton />
            </>
          ) : activeItems.length > 0 ? (
            <>
              {activeItems.slice(0, 3).map((item, index) => (
                <ActivityItem
                  key={`${item.type}-${item.id}-${index}`}
                  item={item}
                  onPress={() => handleItemPress(item)}
                />
              ))}
              {activeItems.length > 3 && (
                <TouchableOpacity
                  style={styles.showAllButton}
                  onPress={() => navigation.navigate('Activities')}
                >
                  <Text style={styles.showAllText}>
                    Show all activities ({activeItems.length})
                  </Text>
                  <ArrowRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Package size={18} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                No active shipments or offers
              </Text>
            </View>
          )}
        </View>

        {/* Explore Section */}
        <View style={styles.section}>
          <View style={styles.exploreHeader}>
            <Text style={styles.sectionTitle}>Explore the Raven</Text>
            <Text style={styles.subtitle}>
              Safe Delivery & Free Travelling!
            </Text>
          </View>

          {/* Main Card - Send a Package */}
          <TouchableOpacity
            style={styles.mainCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DeliveriesTab')}
          >
            <View style={styles.mainCardContent}>
              <Text style={styles.mainCardTitle}>Send a Package</Text>
              <Text style={styles.mainCardDescription}>
                Find a verified traveler to deliver your items anywhere in the world.
              </Text>
            </View>
            <View style={styles.mainCardIcon}>
              <Box size={80} color={colors.textTertiary} strokeWidth={1} />
            </View>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
  },
  exploreHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  emptyStateText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  showAllText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  mainCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainCardContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  mainCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  mainCardDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  mainCardIcon: {
    opacity: 0.5,
  },
});
