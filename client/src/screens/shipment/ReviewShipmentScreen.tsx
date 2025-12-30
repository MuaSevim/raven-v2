import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Plane, 
  Navigation, 
  Package, 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  Mail,
  Check,
  Edit3,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StepHeader } from '../../components/shipment/StepComponents';
import { useShipmentStore } from '../../store/useShipmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatDate(date: Date | null): string {
  if (!date) return 'Not set';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

interface ReviewSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

function ReviewSection({ icon, title, children, onEdit }: ReviewSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconTitle}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Edit3 size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

export default function ReviewShipmentScreen() {
  const navigation = useNavigation<any>();
  const { draft, resetDraft, totalSteps } = useShipmentStore();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress] = useState(new Animated.Value(0));
  
  const getCurrencySymbol = () => {
    switch (draft.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'SEK': return 'kr';
      default: return '$';
    }
  };
  
  const handlePublish = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a shipment');
      return;
    }
    
    setLoading(true);
    
    // Animate progress
    Animated.timing(uploadProgress, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false,
    }).start();
    
    try {
      const token = await user.getIdToken();
      
      // Prepare shipment data
      const shipmentData = {
        // Route
        originCountry: draft.originCountry,
        originCity: draft.originCity,
        destCountry: draft.destCountry,
        destCity: draft.destCity,
        destAirport: draft.destAirport,
        
        // Meeting Point
        meetingPoint: draft.meetingPointAddress,
        meetingPointLat: draft.meetingPointLat,
        meetingPointLng: draft.meetingPointLng,
        
        // Package
        weight: parseFloat(draft.weight) || 0,
        weightUnit: draft.weightUnit,
        content: draft.content,
        imageUrl: draft.packageImageUri, // In production, upload to storage first
        
        // Dates
        dateStart: draft.dateStart?.toISOString(),
        dateEnd: draft.dateEnd?.toISOString(),
        
        // Pricing
        price: draft.price,
        currency: draft.currency,
        
        // Contact
        senderFullName: draft.senderFullName,
        senderPhone: draft.senderPhone,
        senderPhoneCode: draft.senderPhoneCode,
      };
      
      const response = await fetch(`${API_URL}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shipmentData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create shipment');
      }
      
      const createdShipment = await response.json();
      
      // Reset draft
      resetDraft();
      
      // Navigate to deliveries tab with success
      navigation.reset({
        index: 0,
        routes: [
          { 
            name: 'MainTabs',
            state: {
              routes: [{ name: 'DeliveriesTab' }],
              index: 0,
            }
          }
        ],
      });
      
      // Show success message
      setTimeout(() => {
        Alert.alert(
          '🎉 Shipment Published!',
          'Your delivery request is now live. Travelers can start making offers.',
          [{ text: 'Great!' }]
        );
      }, 500);
      
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      Alert.alert('Error', error.message || 'Failed to publish shipment. Please try again.');
    } finally {
      setLoading(false);
      uploadProgress.setValue(0);
    }
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  const navigateToStep = (screen: string) => {
    navigation.navigate(screen);
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingAnimation}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
            <View style={styles.loadingCircle}>
              <Plane size={32} color={colors.textPrimary} strokeWidth={1.5} />
            </View>
          </View>
          
          <Text style={styles.loadingTitle}>Publishing your shipment...</Text>
          <Text style={styles.loadingSubtitle}>
            Your delivery request is being posted
          </Text>
          
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: uploadProgress.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]} 
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Review & Publish"
        currentStep={7}
        totalSteps={totalSteps}
        onClose={handleBack}
      />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Review your shipment details</Text>
        <Text style={styles.pageHint}>
          Make sure everything looks correct before publishing
        </Text>
        
        {/* Route Section */}
        <ReviewSection
          icon={<MapPin size={20} color={colors.textPrimary} strokeWidth={2} />}
          title="Route"
          onEdit={() => navigateToStep('SetRoute')}
        >
          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.routeValue}>{draft.originCity}, {draft.originCountry}</Text>
          </View>
          <View style={styles.routeDivider}>
            <ChevronRight size={16} color={colors.textTertiary} />
          </View>
          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.routeValue}>{draft.destCity}, {draft.destCountry}</Text>
          </View>
          <View style={styles.airportBadge}>
            <Plane size={14} color={colors.textSecondary} />
            <Text style={styles.airportText}>{draft.destAirport}</Text>
          </View>
        </ReviewSection>
        
        {/* Meeting Point */}
        <ReviewSection
          icon={<Navigation size={20} color={colors.textPrimary} strokeWidth={2} />}
          title="Meeting Point"
          onEdit={() => navigateToStep('MeetingPoint')}
        >
          <Text style={styles.detailText} numberOfLines={2}>
            {draft.meetingPointAddress || 'Not set'}
          </Text>
        </ReviewSection>
        
        {/* Package */}
        <ReviewSection
          icon={<Package size={20} color={colors.textPrimary} strokeWidth={2} />}
          title="Package"
          onEdit={() => navigateToStep('PackageDetails')}
        >
          <View style={styles.packageRow}>
            {draft.packageImageUri && (
              <Image 
                source={{ uri: draft.packageImageUri }} 
                style={styles.packageImage} 
              />
            )}
            <View style={styles.packageInfo}>
              <Text style={styles.packageWeight}>
                {draft.weight} {draft.weightUnit}
              </Text>
              <Text style={styles.packageContent} numberOfLines={2}>
                {draft.content}
              </Text>
            </View>
          </View>
        </ReviewSection>
        
        {/* Delivery Window */}
        <ReviewSection
          icon={<Calendar size={20} color={colors.textPrimary} strokeWidth={2} />}
          title="Delivery Window"
          onEdit={() => navigateToStep('DeliveryWindow')}
        >
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{formatDate(draft.dateStart)}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatDate(draft.dateEnd)}</Text>
            </View>
          </View>
        </ReviewSection>
        
        {/* Price */}
        <ReviewSection
          icon={<DollarSign size={20} color={colors.textPrimary} strokeWidth={2} />}
          title="Your Offer"
          onEdit={() => navigateToStep('SetPrice')}
        >
          <Text style={styles.priceValue}>
            {getCurrencySymbol()}{draft.price}
          </Text>
          <Text style={styles.priceNote}>
            Traveler will receive {getCurrencySymbol()}{Math.round(draft.price * 0.85)} after platform fee
          </Text>
        </ReviewSection>
        
        {/* Contact */}
        <ReviewSection
          icon={<User size={20} color={colors.textPrimary} strokeWidth={2} />}
          title="Contact Details"
          onEdit={() => navigateToStep('ContactDetails')}
        >
          <View style={styles.contactItem}>
            <User size={16} color={colors.textSecondary} />
            <Text style={styles.contactText}>{draft.senderFullName}</Text>
          </View>
          <View style={styles.contactItem}>
            <Mail size={16} color={colors.textSecondary} />
            <Text style={styles.contactText}>{draft.senderEmail}</Text>
          </View>
          <View style={styles.contactItem}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={styles.contactText}>{draft.senderPhoneCode} {draft.senderPhone}</Text>
          </View>
        </ReviewSection>
      </ScrollView>
      
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublish}
          activeOpacity={0.8}
        >
          <Check size={20} color={colors.textInverse} strokeWidth={2} />
          <Text style={styles.publishButtonText}>Publish Shipment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pageTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  pageHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  // Sections
  section: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  editBtn: {
    padding: spacing.xs,
  },
  // Route
  routeItem: {
    marginBottom: spacing.xs,
  },
  routeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  routeValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  routeDivider: {
    paddingVertical: spacing.xs,
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
    marginTop: spacing.sm,
  },
  airportText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Detail
  detailText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  // Package
  packageRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  packageImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  packageInfo: {
    flex: 1,
  },
  packageWeight: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  packageContent: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  // Price
  priceValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
  },
  priceNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginTop: spacing.xs,
  },
  // Contact
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  contactText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  // Bottom
  bottomContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  publishButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingAnimation: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  loadingCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  loadingSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
  },
});
