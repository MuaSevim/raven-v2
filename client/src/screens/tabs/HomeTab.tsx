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
import { Box, Plane, ShoppingCart, Package, MapPin, ArrowRight, CheckCircle, Clock, MessageCircle } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';

interface ActiveItem {
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

          // 1. Fetch my posted shipments
          const shipmentsRes = await fetch(`${API_URL}/shipments/my/sent`, { headers });
          const shipments = shipmentsRes.ok ? await shipmentsRes.json() : [];

          // 2. Fetch Transactions (Ongoing deliveries)
          const transactionsRes = await fetch(`${API_URL}/payments/transactions`, { headers });
          const transactions = transactionsRes.ok ? await transactionsRes.json() : [];

          // Process Shipments - Include ALL my posted shipments (not just non-completed)
          const myActiveShipments = shipments
            .filter((s: any) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED')
            .map((s: any) => ({
              id: s.id,
              type: 'shipment',
              title: `Package to ${s.destCity}`,
              status: s.status,
              price: s.price,
              currency: s.currency,
              origin: s.originCity,
              destination: s.destCity,
              date: s.createdAt,
              meta: { offersCount: s._count?.offers || 0 }
            }));

          // Process Transactions (My shipments being delivered or deliveries I'm making)
          const myTransactions = transactions
            .filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'FAILED')
            .map((t: any) => ({
              id: t.id,
              type: 'transaction',
              title: 'Delivery in progress',
              status: 'IN_TRANSIT',
              price: t.amount,
              currency: t.currency,
              origin: t.shipment?.originCity || 'Unknown',
              destination: t.shipment?.destCity || 'Unknown',
              date: t.createdAt,
              meta: { role: t.payerId === user.uid ? 'sender' : 'courier' }
            }));

          // Merge and sort by date (most recent first)
          const allItems = [...myActiveShipments, ...myTransactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setActiveItems(allItems);

          // Fetch unread count
          try {
            const unreadRes = await fetch(`${API_URL}/conversations/unread`, { headers });
            if (unreadRes.ok) {
              const unreadData = await unreadRes.json();
              setUnreadCount(unreadData.unreadCount || 0);
            }
          } catch { }
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user])
  );

  const navigateToTab = (tabName: string) => {
    navigation.navigate(tabName);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return colors.success;
      case 'MATCHED': return colors.primary;
      case 'IN_TRANSIT': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (item: ActiveItem) => {
    if (item.type === 'transaction') return 'In Transit';
    if (item.type === 'shipment') {
      if (item.status === 'OPEN') return `${item.meta.offersCount} Offers`;
      return item.status;
    }
    return item.status;
  };

  const handleItemPress = (item: ActiveItem) => {
    if (item.type === 'shipment') {
      navigation.navigate('ShipmentDetail', { shipmentId: item.id });
    } else if (item.type === 'transaction') {
      navigation.navigate('DeliveryTracking', { transactionId: item.id });
    }
  };

  const renderActiveItem = (item: ActiveItem, index: number) => {
    return (
      <TouchableOpacity
        key={`${item.type}-${item.id}-${index}`}
        style={styles.deliveryCard}
        activeOpacity={0.8}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.deliveryHeader}>
          <View style={[styles.deliveryStatus, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Clock size={12} color={getStatusColor(item.status)} />
            <Text style={[styles.deliveryStatusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item)}
            </Text>
          </View>
          <Text style={styles.deliveryPrice}>
            {getCurrencySymbol(item.currency)}{item.price}
          </Text>
        </View>

        <Text style={styles.deliveryTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.deliveryRoute}>
          <View style={styles.deliveryLocation}>
            <MapPin size={12} color={colors.textTertiary} />
            <Text style={styles.deliveryCity}>{item.origin}</Text>
          </View>
          <ArrowRight size={14} color={colors.textTertiary} />
          <View style={styles.deliveryLocation}>
            <MapPin size={12} color={colors.textTertiary} />
            <Text style={styles.deliveryCity}>{item.destination}</Text>
          </View>
        </View>

        <View style={styles.deliveryFooter}>
          <Text style={styles.deliveryPerson}>
            {item.type === 'shipment' ? 'Posted by You' : 'Ongoing Delivery'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Activities Section - Always Visible Header */}
        <View style={styles.ongoingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Activities</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {!loading && activeItems.length > 3 && (
                <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => navigation.navigate('Inbox')}
              >
                <MessageCircle size={24} color={colors.textPrimary} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Based on State */}
          {loading ? (
            <View style={styles.statusBanner}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Loading your activity...</Text>
            </View>
          ) : activeItems.length > 0 ? (
            <>
              {activeItems.slice(0, 3).map((item, index) => renderActiveItem(item, index))}
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
            <View style={styles.statusBanner}>
              <Package size={18} color={colors.textSecondary} />
              <Text style={styles.statusText}>
                No active shipments or offers
              </Text>
            </View>
          )}
        </View>

        {/* Header 'Explore the Raven' */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Explore the Raven</Text>
            <Text style={styles.subtitle}>
              Safe Delivery & Free Travelling!
            </Text>
          </View>
        </View>

        {/* Main Card - Send a Package */}
        <TouchableOpacity
          style={styles.mainCard}
          activeOpacity={0.8}
          onPress={() => navigateToTab('DeliveriesTab')}
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

        {/* Two Column Cards */}
        <View style={styles.cardsRow}>
          {/* Travel & Earn Card */}
          <TouchableOpacity
            style={styles.smallCard}
            activeOpacity={0.8}
            onPress={() => navigateToTab('TravelersTab')}
          >
            <View style={styles.smallCardIcon}>
              <Plane size={28} color={colors.textPrimary} strokeWidth={2} />
            </View>
            <View style={styles.smallCardContent}>
              <Text style={styles.smallCardTitle}>Travel & Earn</Text>
              <Text style={styles.smallCardDescription}>
                Make money while you fly.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Shop Globally Card */}
          <TouchableOpacity
            style={styles.smallCard}
            activeOpacity={0.8}
            onPress={() => navigateToTab('ShopTab')}
          >
            <View style={styles.smallCardIcon}>
              <ShoppingCart size={28} color={colors.textPrimary} strokeWidth={2} />
            </View>
            <View style={styles.smallCardContent}>
              <Text style={styles.smallCardTitle}>Shop Globally</Text>
              <Text style={styles.smallCardDescription}>
                Buy from any store.
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  chatButton: {
    position: 'relative',
    padding: spacing.sm,
  },
  chatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBadgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 10,
    color: colors.textInverse,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  statusBannerActive: {
    backgroundColor: '#22C55E15',
    borderWidth: 1,
    borderColor: '#22C55E30',
  },
  statusText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statusTextActive: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#22C55E',
  },
  // Main Card
  mainCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 200,
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
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  mainCardIcon: {
    opacity: 0.6,
  },
  // Two Column Cards
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  smallCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  smallCardIcon: {
    marginBottom: spacing.sm,
  },
  smallCardContent: {
    marginTop: spacing.sm,
  },
  smallCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  smallCardDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Ongoing Deliveries
  ongoingSection: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  seeAllText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  deliveryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  deliveryStatusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  deliveryPrice: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  deliveryTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  deliveryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  deliveryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryCity: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  deliveryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryPerson: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  showAllText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
