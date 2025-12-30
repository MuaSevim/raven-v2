import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  User, 
  MessageCircle,
  Phone,
  CheckCircle,
  Clock,
  Truck,
  Flag,
  Ban,
  DollarSign,
} from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface DeliveryDetails {
  id: string;
  shipment: {
    id: string;
    content: string;
    originCity: string;
    originCountry: string;
    destCity: string;
    destCountry: string;
    price: number;
    currency: string;
    status: string;
    dateStart: string;
    dateEnd: string;
    senderPhone?: string;
    sender: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    };
    courier: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  role: 'sender' | 'courier';
}

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_STEPS = [
  { key: 'MATCHED', label: 'Matched', icon: CheckCircle },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Flag },
];

export default function DeliveryTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  
  const { transactionId } = route.params || {};
  
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDelivery = async () => {
    if (!user || !transactionId) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/payments/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const transactions = await response.json();
        const found = transactions.find((t: any) => t.id === transactionId);
        if (found) {
          setDelivery(found);
        }
      }
    } catch (err) {
      console.error('Error fetching delivery:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDelivery();
    }, [user, transactionId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDelivery();
  };

  const handleConfirmDelivery = async () => {
    if (!user || !delivery) return;
    
    Alert.alert(
      'Confirm Delivery',
      'Are you sure you want to confirm delivery? This will release the payment to the courier.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              const token = await user.getIdToken();
              const response = await fetch(`${API_URL}/payments/release/${delivery.shipment.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to confirm delivery');
              }
              
              const result = await response.json();
              Alert.alert('Success', result.message);
              fetchDelivery();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelDelivery = async () => {
    if (!user || !delivery) return;
    
    Alert.alert(
      'Cancel Delivery',
      'Are you sure you want to cancel? This will refund your payment.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const token = await user.getIdToken();
              const response = await fetch(`${API_URL}/payments/refund/${delivery.shipment.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to cancel delivery');
              }
              
              const result = await response.json();
              Alert.alert('Cancelled', result.message, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getCurrentStepIndex = () => {
    if (!delivery) return 0;
    const status = delivery.shipment.status;
    const index = STATUS_STEPS.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
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

  if (!delivery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Delivery not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = getCurrentStepIndex();
  const isSender = delivery.role === 'sender';
  const otherPerson = isSender ? delivery.shipment.courier : delivery.shipment.sender;
  const otherName = otherPerson 
    ? `${otherPerson.firstName || ''} ${otherPerson.lastName || ''}`.trim() || 'User'
    : 'User';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Tracking</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textPrimary}
          />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusBadge,
              delivery.shipment.status === 'DELIVERED' && styles.statusBadgeCompleted,
            ]}>
              {delivery.shipment.status === 'DELIVERED' ? (
                <CheckCircle size={16} color="#22C55E" />
              ) : (
                <Truck size={16} color={colors.textPrimary} />
              )}
              <Text style={[
                styles.statusText,
                delivery.shipment.status === 'DELIVERED' && styles.statusTextCompleted,
              ]}>
                {delivery.shipment.status === 'MATCHED' ? 'In Progress' : 
                 delivery.shipment.status === 'IN_TRANSIT' ? 'In Transit' : 
                 delivery.shipment.status === 'DELIVERED' ? 'Delivered' : delivery.shipment.status}
              </Text>
            </View>
            <Text style={styles.amount}>
              {getCurrencySymbol(delivery.currency)}{delivery.amount}
            </Text>
          </View>

          {/* Progress Steps */}
          <View style={styles.progressContainer}>
            {STATUS_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <View key={step.key} style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    isCompleted && styles.progressDotCompleted,
                    isCurrent && styles.progressDotCurrent,
                  ]}>
                    <StepIcon size={14} color={isCompleted ? '#fff' : colors.textTertiary} />
                  </View>
                  <Text style={[
                    styles.progressLabel,
                    isCompleted && styles.progressLabelCompleted,
                  ]}>
                    {step.label}
                  </Text>
                  {index < STATUS_STEPS.length - 1 && (
                    <View style={[
                      styles.progressLine,
                      isCompleted && styles.progressLineCompleted,
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Package Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Package size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>{delivery.shipment.content}</Text>
            </View>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.infoCard}>
            <View style={styles.routeItem}>
              <View style={styles.routeDot} />
              <View>
                <Text style={styles.routeCity}>{delivery.shipment.originCity}</Text>
                <Text style={styles.routeCountry}>{delivery.shipment.originCountry}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, styles.routeDotDest]} />
              <View>
                <Text style={styles.routeCity}>{delivery.shipment.destCity}</Text>
                <Text style={styles.routeCountry}>{delivery.shipment.destCountry}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isSender ? 'Courier' : 'Sender'}</Text>
          <View style={styles.infoCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <User size={18} color={colors.textSecondary} />
                <Text style={styles.contactName}>{otherName}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => navigation.navigate('Chat', {
                    shipmentId: delivery.shipment.id,
                    recipientId: otherPerson?.id,
                    recipientName: otherName,
                  })}
                >
                  <MessageCircle size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Window */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Window</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Clock size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {formatDate(delivery.shipment.dateStart)} - {formatDate(delivery.shipment.dateEnd)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {delivery.status === 'HELD' && delivery.shipment.status !== 'DELIVERED' && (
          <View style={styles.actionsSection}>
            {isSender && (
              <>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleConfirmDelivery}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <>
                      <CheckCircle size={20} color={colors.textInverse} />
                      <Text style={styles.confirmButtonText}>Confirm Delivery Received</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelDelivery}
                  disabled={actionLoading}
                >
                  <Ban size={18} color="#EF4444" />
                  <Text style={styles.cancelButtonText}>Cancel & Refund</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Payment Released Notice */}
        {delivery.status === 'RELEASED' && (
          <View style={styles.completedNotice}>
            <DollarSign size={20} color="#22C55E" />
            <Text style={styles.completedText}>
              Payment of {getCurrencySymbol(delivery.currency)}{delivery.amount} has been released
            </Text>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  statusCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusBadgeCompleted: {
    backgroundColor: '#22C55E20',
  },
  statusText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  statusTextCompleted: {
    color: '#22C55E',
  },
  amount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressDotCompleted: {
    backgroundColor: '#22C55E',
  },
  progressDotCurrent: {
    backgroundColor: colors.textPrimary,
  },
  progressLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  progressLabelCompleted: {
    color: colors.textPrimary,
  },
  progressLine: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.border,
  },
  progressLineCompleted: {
    backgroundColor: '#22C55E',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textPrimary,
  },
  routeDotDest: {
    backgroundColor: '#22C55E',
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: 5,
    marginVertical: spacing.xs,
  },
  routeCity: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  routeCountry: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#22C55E',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  confirmButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#EF444420',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: '#EF4444',
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#22C55E20',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  completedText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#22C55E',
  },
});
