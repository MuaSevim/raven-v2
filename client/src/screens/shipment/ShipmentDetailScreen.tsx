import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  X,
  BadgeCheck,
  Package,
  Calendar,
  Shield,
  MessageCircle,
  Scale,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

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
  packageType: string;
  imageUrl: string | null;
  status: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isVerified: boolean;
  };
}

interface UserOffer {
  id: string;
  status: string;
  conversationId?: string;
}

const getCurrencySymbol = (c: string) => ({ EUR: '€', GBP: '£', SEK: 'kr' }[c] || '$');
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ShipmentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const shipmentId = route.params?.shipmentId;

  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerMessage, setOfferMessage] = useState("Hi! I'm traveling on this route and can deliver your package.");
  const [submitting, setSubmitting] = useState(false);
  const [userOffer, setUserOffer] = useState<UserOffer | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (shipmentId) {
      fetchShipment();
      fetchUserOffer();
    }
  }, [shipmentId]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const fetchUserOffer = async () => {
    if (!shipmentId || !user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shipments/${shipmentId}/my-offer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data) setUserOffer(data);
      }
    } catch (err) {
      // No offer exists - that's fine
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

      const offer = await res.json();
      setUserOffer({ id: offer.id, status: 'PENDING', conversationId: offer.conversationId });
      setShowOfferModal(false);
      Alert.alert('Success', 'Your offer has been sent!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToChat = () => {
    if (!shipment || !userOffer) return;
    navigation.navigate('Chat', {
      shipmentId: shipment.id,
      recipientId: shipment.sender.id,
    });
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
          <Text style={styles.headerTitle}>Shipment Detail</Text>
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
  const senderName = `${shipment.sender.firstName || ''} ${shipment.sender.lastName || ''}`.trim() || 'Unknown';
  const platformFee = Math.round(shipment.price * 0.15);
  const travelerReceives = shipment.price - platformFee;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipment Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Route & Delivery Window Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.routeDot} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>From</Text>
                <Text style={styles.routeCity}>{shipment.originCity}</Text>
                <Text style={styles.routeCountry}>{shipment.originCountry}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.textPrimary }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeCity}>{shipment.destCity}</Text>
                <Text style={styles.routeCountry}>{shipment.destCountry}</Text>
              </View>
            </View>
          </View>

          {/* Delivery Window */}
          <View style={styles.deliveryWindowContainer}>
            <Text style={styles.cardTitle}>Timeline</Text>
            <View style={styles.deliveryWindow}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={styles.deliveryWindowText}>
                {formatDate(shipment.dateStart)} - {formatDate(shipment.dateEnd)}
              </Text>
            </View>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Package Details</Text>

          <View style={styles.packageDetailList}>
            {/* Contents */}
            <View style={styles.packageDetailItem}>
              <View style={styles.packageIconContainer}>
                <Package size={20} color={colors.textPrimary} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.packageDetailLabel}>Contents</Text>
                <Text style={styles.packageDetailValue}>{shipment.content}</Text>
              </View>
            </View>

            {/* Weight */}
            <View style={styles.packageDetailItem}>
              <View style={styles.packageIconContainer}>
                <Scale size={20} color={colors.textPrimary} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.packageDetailLabel}>Weight</Text>
                <Text style={styles.packageDetailValue}>{shipment.weight} {shipment.weightUnit}</Text>
              </View>
            </View>

            {/* Type */}
            <View style={styles.packageDetailItem}>
              <View style={styles.packageIconContainer}>
                <Package size={20} color={colors.textPrimary} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.packageDetailLabel}>Type</Text>
                <Text style={styles.packageDetailValue}>{shipment.packageType || 'Standard Package'}</Text>
              </View>
            </View>
          </View>

          {/* Package Image at Bottom */}
          {shipment.imageUrl && (
            <Image source={{ uri: shipment.imageUrl }} style={styles.packageImageLarge} />
          )}
        </View>

        {/* Your Earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Your Earnings</Text>

          <View style={styles.earningsMainRow}>
            <Text style={styles.earningsAmount}>{currencySymbol}{travelerReceives}</Text>
            <View style={styles.afterFeesBadge}>
              <Text style={styles.afterFeesText}>After fees</Text>
            </View>
          </View>

          <View style={styles.earningsDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Sender offers</Text>
            <Text style={styles.breakdownValue}>{currencySymbol}{shipment.price}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform fee (15%)</Text>
            <Text style={[styles.breakdownValue, styles.breakdownValueNegative]}>-{currencySymbol}{platformFee}</Text>
          </View>
        </View>

        {/* Posted By */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Posted By</Text>
          <TouchableOpacity
            style={styles.senderRow}
            onPress={() => navigation.navigate('PublicProfile', { userId: shipment.sender.id })}
          >
            {shipment.sender.avatar ? (
              <Image source={{ uri: shipment.sender.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{(shipment.sender.firstName || 'U')[0]}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.senderName}>{senderName}</Text>
                {shipment.sender.isVerified && <BadgeCheck size={14} color={colors.textPrimary} fill={colors.background} />}
              </View>
              <Text style={styles.senderRole}>Member since 2025</Text>
            </View>
          </TouchableOpacity>

          {/* Make Offer / You Made an Offer */}
          {!isMySender && (
            <View style={styles.offerSection}>
              {userOffer ? (
                <>
                  <View style={styles.offerMadeBadge}>
                    <Text style={styles.offerMadeText}>✓ You made an offer</Text>
                  </View>
                  <TouchableOpacity style={styles.goToChatLink} onPress={handleGoToChat}>
                    <MessageCircle size={16} color={colors.textSecondary} />
                    <Text style={styles.goToChatText}>Go to chat</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={() => setShowOfferModal(true)}>
                  <Text style={styles.primaryButtonText}>Make Offer</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Offer Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide" onRequestClose={() => setShowOfferModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalTouchable}
            activeOpacity={1}
            onPress={() => Keyboard.dismiss()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Make an Offer</Text>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowOfferModal(false); }}>
                  <X size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Introduce yourself to {senderName}
              </Text>

              <TextInput
                style={styles.modalInput}
                value={offerMessage}
                onChangeText={setOfferMessage}
                placeholder="Hi! I'm traveling on this route..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                onPress={handleMakeOffer}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Offer</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

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
  card: { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textPrimary, marginBottom: spacing.md },

  // Route
  routeContainer: { position: 'relative' },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  routeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, marginTop: 4 },
  routeInfo: { marginLeft: spacing.md, flex: 1 },
  routeLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textTertiary, textTransform: 'capitalize' },
  routeCity: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.textPrimary },
  routeCountry: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  routeLine: { position: 'absolute', left: 5, top: 16, width: 2, height: 40, backgroundColor: colors.border },

  // Delivery Window
  deliveryWindowContainer: {
    flexDirection: 'column', borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  deliveryWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deliveryWindowText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textPrimary },


  // Package
  packageDetailList: { flexDirection: 'column', gap: spacing.md, marginBottom: spacing.md },
  packageDetailItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  packageIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  packageDetailLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textTertiary, marginBottom: 2 },
  packageDetailValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textPrimary, textTransform: 'capitalize' },
  packageImageLarge: { width: '100%', height: 200, borderRadius: borderRadius.lg, backgroundColor: colors.border, marginTop: spacing.sm },

  // Earnings
  earningsCard: {
    backgroundColor: colors.backgroundSecondary, // or '#F9FAFB'
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  earningsTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.textPrimary, marginBottom: spacing.sm },
  earningsMainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  earningsAmount: { fontFamily: typography.fontFamily.bold, fontSize: 36, color: colors.textPrimary },
  afterFeesBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6 },
  afterFeesText: { fontFamily: typography.fontFamily.medium, fontSize: 12, color: '#166534' },
  earningsDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  breakdownLabel: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary },
  breakdownValue: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: colors.textPrimary },
  breakdownValueNegative: { color: '#EF4444' },

  // Sender
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.textPrimary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontFamily: typography.fontFamily.semiBold, fontSize: 20, color: colors.textInverse },
  senderName: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textPrimary },
  senderRole: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, color: colors.textTertiary },

  // Offer Section
  offerSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  offerMadeBadge: {
    backgroundColor: '#8B5CF620',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center'
  },
  offerMadeText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, color: '#8B5CF6' },
  goToChatLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  goToChatText: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary },

  // Button
  primaryButton: { backgroundColor: colors.textPrimary, borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textInverse },
  bottomPadding: { height: spacing.xl * 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalTouchable: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  modalTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.xl, color: colors.textPrimary },
  modalSubtitle: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  modalInput: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
});
