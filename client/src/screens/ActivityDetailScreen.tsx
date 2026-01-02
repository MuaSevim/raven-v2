import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  X,
  BadgeCheck,
  Package,
  MessageCircle,
  Plane,
  User,
  Clock,
  HandHeart,
  CheckCircle,
  Lock,
  AlertTriangle,
  Ban,
  CreditCard,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { API_URL } from '../config';
import { colors, typography, spacing, borderRadius } from '../theme';

// =============================================================================
// TYPES
// =============================================================================

interface ShipmentDetails {
  id: string;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  dateStart: string;
  dateEnd: string;
  price: number;
  currency: string;
  content: string;
  weight: number;
  weightUnit: string;
  imageUrl: string | null;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isVerified: boolean;
  };
  courier?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isVerified: boolean;
  } | null;
  _count?: { offers: number };
}

// =============================================================================
// HELPERS
// =============================================================================

const getCurrencySymbol = (c: string) => ({ EUR: '€', GBP: '£', SEK: 'kr' }[c] || '$');
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const STATUS_FLOW = ['MATCHED', 'HANDED_OVER', 'ON_WAY', 'DELIVERED'];
const STATUS_LABELS: Record<string, { label: string; Icon: any }> = {
  MATCHED: { label: 'Matched', Icon: CheckCircle },
  HANDED_OVER: { label: 'Handed Over', Icon: HandHeart },
  ON_WAY: { label: 'On Way', Icon: Plane },
  DELIVERED: { label: 'Delivered', Icon: Package },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ActivityDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  const shipmentId = route.params?.shipmentId;



  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerMessage, setOfferMessage] = useState("Hi! I'm traveling on this route and can deliver your package.");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (shipmentId) fetchShipment();
  }, [shipmentId]);

  const fetchShipment = async () => {
    if (!shipmentId || !user) return setLoading(false);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shipments/${shipmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShipment(data);
      }
    } catch (err) {
      console.error('Error fetching shipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!shipment || !user) return;
    setSubmitting(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shipments/${shipment.id}/offers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: offerMessage }),
      });

      if (!res.ok) throw new Error((await res.json()).message || 'Failed to send offer');

      setShowOfferModal(false);
      Alert.alert('Success', 'Your offer has been sent!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Delivery', 'Are you sure you want to cancel this delivery?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => Alert.alert('Cancelled', 'Delivery has been cancelled') },
    ]);
  };

  const handleReport = () => {
    Alert.alert('Report Issue', 'What would you like to report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspicious Activity', onPress: () => Alert.alert('Reported', 'Thank you for reporting') },
      { text: 'Lost Package', onPress: () => Alert.alert('Reported', 'We will investigate') },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  if (!shipment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Package size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>Shipment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isMySender = shipment.sender.id === user?.uid;
  const currencySymbol = getCurrencySymbol(shipment.currency);
  const currentStatusIndex = STATUS_FLOW.indexOf(shipment.status);
  const ravenUser = shipment.courier;
  const ravenName = ravenUser ? `${ravenUser.firstName || ''} ${ravenUser.lastName || ''}`.trim() : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Progress */}
        {shipment.status !== 'OPEN' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Progress</Text>
            <View style={styles.progressContainer}>
              {STATUS_FLOW.map((status, i) => {
                const { label, Icon } = STATUS_LABELS[status];
                const isComplete = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                const isLast = i === STATUS_FLOW.length - 1;

                return (
                  <View key={status} style={styles.progressStep}>
                    <View style={[styles.progressDot, isComplete && styles.progressDotComplete, isCurrent && styles.progressDotCurrent]}>
                      <Icon size={14} color={isComplete ? '#fff' : colors.textTertiary} />
                    </View>
                    <Text style={[styles.progressLabel, isComplete && styles.progressLabelComplete]}>{label}</Text>
                    {!isLast && <View style={[styles.progressLine, isComplete && styles.progressLineComplete]} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Route Card with Highlighting */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, (currentStatusIndex >= 0 && currentStatusIndex < 2) && styles.routeDotActive]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeCity}>{shipment.originCity}</Text>
                <Text style={styles.routeCountry}>{shipment.originCountry}</Text>
              </View>
            </View>
            <View style={[styles.routeLine, currentStatusIndex === 2 && styles.routeLineActive]} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, currentStatusIndex >= 3 && styles.routeDotActive]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeCity}>{shipment.destCity}</Text>
                <Text style={styles.routeCountry}>{shipment.destCountry}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Package with Image */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Package</Text>
          {shipment.imageUrl && (
            <Image source={{ uri: shipment.imageUrl }} style={styles.packageImage} />
          )}
          <View style={styles.packageInfo}>
            <Package size={18} color={colors.textSecondary} />
            <Text style={styles.packageText}>{shipment.content}</Text>
          </View>
          <View style={styles.packageInfo}>
            <Text style={styles.packageMeta}>{shipment.weight} {shipment.weightUnit}</Text>
          </View>
        </View>

        {/* Delivery Window */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Window</Text>
          <View style={styles.dateRow}>
            <Clock size={18} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {formatDate(shipment.dateStart)} - {formatDate(shipment.dateEnd)}
            </Text>
          </View>
        </View>

        {/* Payment Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Status</Text>
          <View style={styles.paymentRow}>
            <View style={[styles.paymentDot, shipment.status !== 'DELIVERED' && styles.paymentDotActive]}>
              <Lock size={12} color={shipment.status !== 'DELIVERED' ? '#fff' : colors.textTertiary} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>{shipment.status !== 'DELIVERED' ? 'Payment Held' : 'Payment Held ✓'}</Text>
              <Text style={styles.paymentValue}>{currencySymbol}{shipment.price} in escrow</Text>
            </View>
          </View>
          <View style={[styles.paymentConnector, shipment.status === 'DELIVERED' && styles.paymentConnectorActive]} />
          <View style={styles.paymentRow}>
            <View style={[styles.paymentDot, shipment.status === 'DELIVERED' && styles.paymentDotActive]}>
              <CheckCircle size={12} color={shipment.status === 'DELIVERED' ? '#fff' : colors.textTertiary} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>{shipment.status === 'DELIVERED' ? 'Payment Released ✓' : 'Pending Release'}</Text>
              <Text style={styles.paymentValue}>Upon delivery confirmation</Text>
            </View>
          </View>
        </View>

        {/* Raven (Courier) Section */}
        {ravenUser && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Raven</Text>
            <View style={styles.ravenRow}>
              <TouchableOpacity
                style={styles.ravenInfo}
                onPress={() => navigation.navigate('PublicProfile', { userId: ravenUser.id })}
              >
                {ravenUser.avatar ? (
                  <Image source={{ uri: ravenUser.avatar }} style={styles.ravenAvatar} />
                ) : (
                  <View style={styles.ravenAvatarPlaceholder}>
                    <Text style={styles.ravenInitial}>{(ravenUser.firstName || 'R')[0]}</Text>
                  </View>
                )}
                <View style={styles.ravenNameContainer}>
                  <View style={styles.ravenNameRow}>
                    <Text style={styles.ravenName}>{ravenName}</Text>
                    {ravenUser.isVerified && <BadgeCheck size={14} color={colors.textPrimary} fill={colors.background} />}
                  </View>
                  <Text style={styles.ravenSubtitle}>Tap to view profile</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => navigation.navigate('Chat', { shipmentId: shipment.id, recipientId: ravenUser.id })}
              >
                <MessageCircle size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Price */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings</Text>
          <Text style={styles.priceText}>{currencySymbol}{Math.floor(shipment.price * 0.9)}</Text>
          <Text style={styles.priceSubtext}>After 10% platform fee</Text>
        </View>

        {/* Action Buttons */}
        {shipment.status === 'OPEN' && !isMySender && (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowOfferModal(true)}>
            <Text style={styles.primaryButtonText}>Make Offer</Text>
          </TouchableOpacity>
        )}

        {/* Cancel & Report */}
        {shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Ban size={18} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
              <AlertTriangle size={18} color="#F59E0B" />
              <Text style={styles.reportButtonText}>Report</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Offer Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide" onRequestClose={() => setShowOfferModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make an Offer</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={offerMessage}
              onChangeText={setOfferMessage}
              placeholder="Introduce yourself..."
              placeholderTextColor={colors.textTertiary}
              multiline
            />
            <TouchableOpacity style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]} onPress={handleMakeOffer} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send Offer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textSecondary, marginTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: spacing.xs },
  headerTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  // Cards
  card: { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textPrimary, marginBottom: spacing.md },
  // Progress
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStep: { alignItems: 'center', flex: 1, position: 'relative' },
  progressDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  progressDotComplete: { backgroundColor: '#22C55E' },
  progressDotCurrent: { backgroundColor: colors.textPrimary },
  progressLabel: { fontFamily: typography.fontFamily.medium, fontSize: 10, color: colors.textTertiary, textAlign: 'center' },
  progressLabelComplete: { color: colors.textPrimary },
  progressLine: { position: 'absolute', top: 16, left: '60%', right: '-40%', height: 2, backgroundColor: colors.border, zIndex: -1 },
  progressLineComplete: { backgroundColor: '#22C55E' },
  // Route
  routeContainer: { position: 'relative' },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  routeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border, marginTop: 4 },
  routeDotActive: { backgroundColor: '#22C55E' },
  routeInfo: { marginLeft: spacing.md, flex: 1 },
  routeLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textTertiary, textTransform: 'capitalize' },
  routeCity: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.textPrimary },
  routeCountry: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  routeLine: { position: 'absolute', left: 6, top: 20, width: 2, height: 40, backgroundColor: colors.border },
  routeLineActive: { backgroundColor: '#22C55E' },
  // Package
  packageImage: { width: '100%', height: 150, borderRadius: borderRadius.lg, marginBottom: spacing.md, backgroundColor: colors.border },
  packageInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  packageText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textPrimary },
  packageMeta: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, marginLeft: 26 },
  // Date
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textPrimary },
  // Payment
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  paymentDotActive: { backgroundColor: colors.textPrimary },
  paymentInfo: { marginLeft: spacing.md },
  paymentLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textPrimary },
  paymentValue: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textSecondary },
  paymentConnector: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 11, marginVertical: 4 },
  paymentConnectorActive: { backgroundColor: colors.textPrimary },
  // Raven
  ravenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ravenInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ravenAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border },
  ravenAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center' },
  ravenInitial: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.textInverse },
  ravenNameContainer: { marginLeft: spacing.md, flex: 1 },
  ravenNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ravenName: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textPrimary },
  ravenSubtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textTertiary },
  chatButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  // Price
  priceText: { fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize['2xl'], color: colors.textPrimary },
  priceSubtext: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  // Buttons
  primaryButton: { backgroundColor: colors.textPrimary, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textInverse },
  actionButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  cancelButtonText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textPrimary },
  reportButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, borderRadius: borderRadius.lg },
  reportButtonText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  bottomPadding: { height: spacing.xl * 2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  modalTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.xl, color: colors.textPrimary },
  modalInput: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg, padding: spacing.md, minHeight: 100, textAlignVertical: 'top', marginBottom: spacing.lg },
});
