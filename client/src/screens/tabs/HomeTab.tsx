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
import { Box, Plane, ShoppingCart, Package, MapPin, ArrowRight, CheckCircle, Clock, Truck } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';

interface OngoingDelivery {
  id: string;
  shipment: {
    id: string;
    title: string;
    originCity: string;
    destCity: string;
    price: number;
    currency: string;
    status: string;
  };
  status: string;
  createdAt: string;
  role: 'sender' | 'courier';
  otherUser: {
    firstName: string | null;
    lastName: string | null;
  };
}

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
}

export default function HomeTab() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [ongoingDeliveries, setOngoingDeliveries] = useState<OngoingDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);

  // Fetch ongoing deliveries
  useFocusEffect(
    useCallback(() => {
      const fetchOngoingDeliveries = async () => {
        if (!user) {
          setLoadingDeliveries(false);
          return;
        }
        
        try {
          const token = await user.getIdToken();
          const response = await fetch(`${API_URL}/payments/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (response.ok) {
            const transactions = await response.json();
            // Filter to only show held/in-progress transactions
            const ongoing = transactions.filter((t: any) => 
              t.status === 'HELD' && t.shipment?.status === 'MATCHED'
            );
            setOngoingDeliveries(ongoing);
          }
        } catch (err) {
          console.error('Error fetching ongoing deliveries:', err);
        } finally {
          setLoadingDeliveries(false);
        }
      };
      
      fetchOngoingDeliveries();
    }, [user])
  );

  const navigateToTab = (tabName: string) => {
    navigation.navigate(tabName);
  };

  const renderOngoingDelivery = (delivery: OngoingDelivery) => {
    const otherName = delivery.otherUser 
      ? `${delivery.otherUser.firstName || ''} ${delivery.otherUser.lastName || ''}`.trim() || 'User'
      : 'User';
    
    return (
      <TouchableOpacity 
        key={delivery.id}
        style={styles.deliveryCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DeliveryTracking', { transactionId: delivery.id })}
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryStatus}>
            <Truck size={14} color="#22C55E" />
            <Text style={styles.deliveryStatusText}>In Transit</Text>
          </View>
          <Text style={styles.deliveryPrice}>
            {getCurrencySymbol(delivery.shipment.currency)}{delivery.shipment.price}
          </Text>
        </View>
        
        <Text style={styles.deliveryTitle} numberOfLines={1}>
          {delivery.shipment.title}
        </Text>
        
        <View style={styles.deliveryRoute}>
          <View style={styles.deliveryLocation}>
            <MapPin size={12} color={colors.textTertiary} />
            <Text style={styles.deliveryCity}>{delivery.shipment.originCity}</Text>
          </View>
          <ArrowRight size={14} color={colors.textTertiary} />
          <View style={styles.deliveryLocation}>
            <MapPin size={12} color={colors.textTertiary} />
            <Text style={styles.deliveryCity}>{delivery.shipment.destCity}</Text>
          </View>
        </View>
        
        <View style={styles.deliveryFooter}>
          <Text style={styles.deliveryPerson}>
            {delivery.role === 'sender' ? 'Courier: ' : 'Sender: '}{otherName}
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
        {/* Header with Raven Logo */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Explore the Raven</Text>
          <Text style={styles.subtitle}>
            Safe Delivery & Free Travelling!
          </Text>
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

        {/* Ongoing Deliveries Section */}
        {ongoingDeliveries.length > 0 && (
          <View style={styles.ongoingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ongoing Deliveries</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Inbox')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {ongoingDeliveries.slice(0, 3).map(renderOngoingDelivery)}
          </View>
        )}
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
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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
    textAlign: 'center',
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
    backgroundColor: '#22C55E20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  deliveryStatusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#22C55E',
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
});
