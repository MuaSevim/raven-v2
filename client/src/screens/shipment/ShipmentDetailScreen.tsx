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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  X, 
  BadgeCheck, 
  MapPin, 
  Calendar, 
  Package, 
  Scale,
  DollarSign,
  MessageCircle,
  Navigation,
  Plane,
  User,
  Phone,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ShipmentDetails {
  id: string;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  meetingPoint: string | null;
  meetingPointLat: number | null;
  meetingPointLng: number | null;
  destAirport: string | null;
  destAirportCode: string | null;
  dateStart: string;
  dateEnd: string;
  price: number;
  currency: string;
  content: string;
  weight: number;
  weightUnit: string;
  imageUrl: string | null;
  status: string;
  senderFullName: string | null;
  senderPhone: string | null;
  senderPhoneCode: string | null;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isVerified: boolean;
    country: string | null;
    city: string | null;
  };
  _count?: {
    offers: number;
  };
}

export default function ShipmentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  
  const shipmentId = route.params?.shipmentId;
  
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerMessage, setOfferMessage] = useState("Hi! I am traveling on this route and would be happy to deliver your package. Let me know if you have any questions!");
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (shipmentId) {
      fetchShipment();
    }
  }, [shipmentId]);
  
  const fetchShipment = async () => {
    if (!shipmentId || !user) {
      setLoading(false);
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/shipments/${shipmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch shipment');
      
      const data = await response.json();
      setShipment(data);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      Alert.alert('Error', 'Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMakeOffer = async () => {
    if (!shipment || !user || offerMessage.length < 10) return;
    
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/shipments/${shipment.id}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: offerMessage }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send offer');
      }
      
      setShowOfferModal(false);
      Alert.alert('Offer Sent!', 'The sender will be notified and can accept your offer.');
      fetchShipment(); // Refresh to update offer count
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };
  
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'EUR': return '\u20AC';
      case 'GBP': return '\u00A3';
      case 'SEK': return 'kr';
      default: return '$';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#22C55E';
      case 'MATCHED': return '#3B82F6';
      case 'IN_TRANSIT': return '#F59E0B';
      case 'DELIVERED': return '#8B5CF6';
      case 'CANCELLED': return '#EF4444';
      default: return colors.textSecondary;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Open for Offers';
      case 'MATCHED': return 'Matched with Traveler';
      case 'IN_TRANSIT': return 'In Transit';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };
  
  // Calculate earnings (price minus 15% Raven fee)
  const ravenFee = shipment ? Math.round(shipment.price * 0.15) : 0;
  const earnings = shipment ? shipment.price - ravenFee : 0;
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.loadingText}>Loading shipment...</Text>
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
          <Text style={styles.headerTitle}>Shipment Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Package size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>Shipment not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const senderName = `${shipment.sender.firstName || ''} ${shipment.sender.lastName || ''}`.trim() || 'Unknown';
  const isMySender = shipment.sender.id === user?.uid;
  const currencySymbol = getCurrencySymbol(shipment.currency);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipment Details</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shipment.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(shipment.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(shipment.status) }]}>
            {getStatusLabel(shipment.status)}
          </Text>
        </View>
        
        {/* Route Card */}
        <View style={styles.card}>
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
              <View style={[styles.routeDot, styles.routeDotDest]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>To</Text>
                <Text style={styles.routeCity}>{shipment.destCity}</Text>
                <Text style={styles.routeCountry}>{shipment.destCountry}</Text>
              </View>
            </View>
          </View>
          
          {shipment.destAirport && (
            <View style={styles.airportBadge}>
              <Plane size={14} color={colors.textSecondary} />
              <Text style={styles.airportText}>
                {shipment.destAirport} ({shipment.destAirportCode})
              </Text>
            </View>
          )}
        </View>
        
        {/* Package Image */}
        {shipment.imageUrl && (
          <View style={styles.card}>
            <Image source={{ uri: shipment.imageUrl }} style={styles.packageImage} />
          </View>
        )}
        
        {/* Price Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Earnings</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceMain}>{currencySymbol}{earnings}</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>After fees</Text>
            </View>
          </View>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Sender offers</Text>
              <Text style={styles.priceValue}>{currencySymbol}{shipment.price}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Platform fee (15%)</Text>
              <Text style={[styles.priceValue, { color: colors.error }]}>-{currencySymbol}{ravenFee}</Text>
            </View>
          </View>
        </View>
        
        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Package Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Package size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Contents</Text>
              <Text style={styles.detailValue}>{shipment.content}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Scale size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{shipment.weight} {shipment.weightUnit}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Delivery Window</Text>
              <Text style={styles.detailValue}>{formatDateRange(shipment.dateStart, shipment.dateEnd)}</Text>
            </View>
          </View>
          
          {shipment.meetingPoint && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Navigation size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Meeting Point</Text>
                <Text style={styles.detailValue}>{shipment.meetingPoint}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Sender Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Posted by</Text>
          
          <TouchableOpacity style={styles.senderRow} activeOpacity={0.7}>
            <View style={styles.senderAvatar}>
              {shipment.sender.avatar ? (
                <Image source={{ uri: shipment.sender.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {senderName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.senderInfo}>
              <View style={styles.senderNameRow}>
                <Text style={styles.senderName}>{senderName}</Text>
                {shipment.sender.isVerified && (
                  <BadgeCheck size={16} color="#3B82F6" fill="#3B82F6" strokeWidth={0} />
                )}
              </View>
              {shipment.sender.city && shipment.sender.country && (
                <Text style={styles.senderLocation}>
                  {shipment.sender.city}, {shipment.sender.country}
                </Text>
              )}
            </View>
            <ChevronRight size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          
          {/* Contact Options */}
          {!isMySender && (
            <View style={styles.contactOptions}>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => navigation.navigate('Chat', {
                  shipmentId: shipment.id,
                  recipientId: shipment.sender.id,
                  recipientName: senderName,
                })}
              >
                <MessageCircle size={18} color={colors.textInverse} />
                <Text style={styles.chatButtonText}>Chat with {senderName.split(' ')[0]}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Offers Count */}
        {shipment._count && shipment._count.offers > 0 && (
          <View style={styles.offersInfo}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.offersText}>
              {shipment._count.offers} traveler{shipment._count.offers > 1 ? 's' : ''} already offered
            </Text>
          </View>
        )}
        
        {/* Posted Date */}
        <Text style={styles.postedDate}>
          Posted on {formatDate(shipment.createdAt)}
        </Text>
      </ScrollView>
      
      {/* Bottom Action */}
      {!isMySender && shipment.status === 'OPEN' && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.offerButton}
            onPress={() => setShowOfferModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.offerButtonText}>Make an Offer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Offer Modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowOfferModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Send Offer</Text>
              <View style={{ width: 40 }} />
            </View>
            
            <View style={styles.modalSenderRow}>
              <View style={styles.modalAvatar}>
                {shipment.sender.avatar ? (
                  <Image source={{ uri: shipment.sender.avatar }} style={styles.modalAvatarImage} />
                ) : (
                  <Text style={styles.modalAvatarText}>{senderName.charAt(0)}</Text>
                )}
              </View>
              <View>
                <Text style={styles.modalSenderName}>To: {senderName}</Text>
                <Text style={styles.modalRoute}>
                  {shipment.originCity}  {shipment.destCity}
                </Text>
              </View>
            </View>
            
            <Text style={styles.modalLabel}>Your message</Text>
            <TextInput
              style={styles.messageInput}
              value={offerMessage}
              onChangeText={setOfferMessage}
              placeholder="Introduce yourself and why you are a good fit..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            
            <View style={styles.modalEarnings}>
              <Text style={styles.modalEarningsLabel}>You will earn</Text>
              <Text style={styles.modalEarningsValue}>{currencySymbol}{earnings}</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.sendButton, (submitting || offerMessage.length < 10) && styles.sendButtonDisabled]}
              onPress={handleMakeOffer}
              disabled={submitting || offerMessage.length < 10}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>
                {submitting ? 'Sending...' : 'Send Offer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  errorButton: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  errorButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  // Cards
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  // Route
  routeContainer: {
    gap: spacing.sm,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textPrimary,
    marginTop: 4,
  },
  routeDotDest: {
    backgroundColor: colors.textTertiary,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 5,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  routeCity: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  routeCountry: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  airportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  airportText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Package Image
  packageImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  priceMain: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 36,
    color: colors.textPrimary,
  },
  priceBadge: {
    backgroundColor: '#22C55E20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  priceBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#22C55E',
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  // Details
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Sender
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  senderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textInverse,
  },
  senderInfo: {
    flex: 1,
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  senderName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  senderLocation: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactOptions: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  chatButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  // Offers Info
  offersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  offersText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  postedDate: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  // Bottom
  bottomContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  offerButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  offerButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  modalSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalAvatarText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  modalSenderName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  modalRoute: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  modalLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  modalEarnings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  modalEarningsLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  modalEarningsValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
});
