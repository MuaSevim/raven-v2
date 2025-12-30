import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, DollarSign, User, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useShipmentStore } from '../../store/useShipmentStore';
import { colors, typography, spacing, borderRadius } from '../../theme';

/**
 * @deprecated This screen is replaced by ReviewShipmentScreen success flow
 * which redirects directly to DeliveriesTab.
 * Keeping for backward compatibility with existing navigation references.
 */
export default function DeliveryPostedScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { draft, resetDraft } = useShipmentStore();
  
  const shipment = route.params?.shipment;
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const dateRange = `${formatDate(draft.dateStart || shipment?.dateStart)} - ${formatDate(draft.dateEnd || shipment?.dateEnd)}`;
  
  const getCurrencySymbol = () => {
    switch (draft.currency || shipment?.currency) {
      case 'EUR': return '';
      case 'GBP': return '';
      case 'SEK': return 'kr';
      default: return '$';
    }
  };
  
  const handleDone = () => {
    resetDraft();
    navigation.navigate('MainTabs', { screen: 'DeliveriesTab' });
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <Check size={32} color={colors.textPrimary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Delivery Posted!</Text>
        <Text style={styles.subtitle}>Your delivery request is now live</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MapPin size={20} color={colors.textPrimary} strokeWidth={1.5} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoTitle}>
              {draft.originCity || shipment?.originCity}, {draft.originCountry || shipment?.originCountry}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <MapPin size={20} color={colors.textPrimary} strokeWidth={1.5} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>To</Text>
            <Text style={styles.infoTitle}>
              {draft.destCity || shipment?.destCity}, {draft.destCountry || shipment?.destCountry}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Calendar size={20} color={colors.textPrimary} strokeWidth={1.5} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Delivery Window</Text>
            <Text style={styles.infoTitle}>{dateRange}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <DollarSign size={20} color={colors.textPrimary} strokeWidth={1.5} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Your Offer</Text>
            <Text style={styles.infoTitle}>
              {getCurrencySymbol()}{draft.price || shipment?.price}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <User size={20} color={colors.textPrimary} strokeWidth={1.5} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Sender</Text>
            <Text style={styles.infoTitle}>
              {draft.senderFullName || shipment?.senderFullName}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Done</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  bottomContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
});
