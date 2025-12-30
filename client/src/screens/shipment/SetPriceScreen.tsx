import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, DollarSign, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StepHeader, BottomButton } from '../../components/shipment/StepComponents';
import { useShipmentStore } from '../../store/useShipmentStore';
import { colors, typography, spacing, borderRadius } from '../../theme';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
];

const MIN_PRICE = 10;
const MAX_PRICE = 500;
const STEP = 5;

export default function SetPriceScreen() {
  const navigation = useNavigation<any>();
  const { draft, setDraft, totalSteps } = useShipmentStore();

  const [price, setPrice] = useState(draft.price || 50);
  const [currency, setCurrency] = useState(draft.currency || 'USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const lastPriceRef = React.useRef(price);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPriceRef.current = price;
      },
      onPanResponderMove: (_, gestureState) => {
        const diff = Math.round(gestureState.dx / 10) * 5; // Sensitivity: 10px = $5
        const newPrice = lastPriceRef.current + diff;
        setPrice(Math.min(Math.max(newPrice, MIN_PRICE), MAX_PRICE));
      },
      onPanResponderRelease: () => {
        lastPriceRef.current = price;
      },
    })
  ).current;

  const canProceed = price >= MIN_PRICE;

  const incrementPrice = () => {
    setPrice(prev => Math.min(prev + STEP, MAX_PRICE));
  };

  const decrementPrice = () => {
    setPrice(prev => Math.max(prev - STEP, MIN_PRICE));
  };

  const handlePriceInput = (value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numValue)) {
      setPrice(Math.min(Math.max(numValue, MIN_PRICE), MAX_PRICE));
    } else if (value === '') {
      setPrice(MIN_PRICE);
    }
  };

  const handleNext = () => {
    setDraft({
      price,
      currency,
    });
    navigation.navigate('ContactDetails');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('MainTabs');
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === currency)?.symbol || '$';
  };

  // Calculate progress percentage for the visual bar
  const progressPercent = ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  // Platform fee calculation (15%)
  const platformFee = Math.round(price * 0.15);
  const travelerReceives = price - platformFee;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Set Your Price"
        currentStep={5}
        totalSteps={totalSteps}
        onClose={handleClose}
        onBack={handleBack}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <DollarSign size={20} color={colors.textPrimary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>How much will you pay?</Text>
        </View>

        <Text style={styles.hint}>
          Set the amount you're willing to pay for this delivery
        </Text>

        {/* Currency Selector */}
        <TouchableOpacity
          style={styles.currencySelector}
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
        >
          <Text style={styles.currencyLabel}>Currency</Text>
          <View style={styles.currencyValue}>
            <Text style={styles.currencyText}>{currency}</Text>
          </View>
        </TouchableOpacity>

        {showCurrencyPicker && (
          <View style={styles.currencyPicker}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.currencyOption,
                  currency === c.code && styles.currencyOptionSelected,
                ]}
                onPress={() => {
                  setCurrency(c.code);
                  setShowCurrencyPicker(false);
                }}
              >
                <Text style={styles.currencyOptionSymbol}>{c.symbol}</Text>
                <Text style={styles.currencyOptionText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Price Display */}
        <View
          style={styles.priceDisplay}
          {...panResponder.panHandlers}
        >
          <Text style={styles.priceSymbol}>{getCurrencySymbol()}</Text>
          <TextInput
            style={styles.priceInput}
            value={price.toString()}
            onChangeText={handlePriceInput}
            keyboardType="number-pad"
            selectTextOnFocus
            editable={false} // Disable direct editing when swipe is active to prevent conflicts, or keep it true but be careful
            pointerEvents="none" // To ensure swipe works smoothly over the input
          />
        </View>

        {/* Price Slider */}
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            onPress={decrementPrice}
            style={styles.sliderButton}
            disabled={price <= MIN_PRICE}
          >
            <Minus size={20} color={price <= MIN_PRICE ? colors.textDisabled : colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${progressPercent}%` }]} />
            <View style={[styles.sliderThumb, { left: `${progressPercent}%` }]} />
          </View>

          <TouchableOpacity
            onPress={incrementPrice}
            style={styles.sliderButton}
            disabled={price >= MAX_PRICE}
          >
            <Plus size={20} color={price >= MAX_PRICE ? colors.textDisabled : colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabel}>{getCurrencySymbol()}{MIN_PRICE}</Text>
          <Text style={styles.rangeLabel}>{getCurrencySymbol()}{MAX_PRICE}</Text>
        </View>

        {/* Fee Breakdown */}
        <View style={styles.feeBreakdown}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Your offer</Text>
            <Text style={styles.feeValue}>{getCurrencySymbol()}{price}</Text>
          </View>
          <View style={styles.feeRow}>
            <View style={styles.feeLabelWithInfo}>
              <Text style={styles.feeLabel}>Platform fee (15%)</Text>
              <Info size={14} color={colors.textTertiary} />
            </View>
            <Text style={styles.feeValueMinus}>-{getCurrencySymbol()}{platformFee}</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeTotal}>Traveler receives</Text>
            <Text style={styles.feeTotalValue}>{getCurrencySymbol()}{travelerReceives}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Info size={16} color={colors.accent} />
          <Text style={styles.infoText}>
            The traveler will receive {getCurrencySymbol()}{travelerReceives} for delivering your package.
            Higher offers get matched faster!
          </Text>
        </View>
      </ScrollView>

      <BottomButton
        label="Next"
        onPress={handleNext}
        disabled={!canProceed}
      />
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
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  // Currency
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  currencyLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  currencyValue: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  currencyText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  currencyPicker: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyOptionSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  currencyOptionSymbol: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    width: 30,
  },
  currencyOptionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Price Display
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  priceSymbol: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 40,
    color: colors.textPrimary,
  },
  priceInput: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 64,
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: 'center',
  },
  // Slider
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textPrimary,
    marginLeft: -10,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  rangeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  // Fee Breakdown
  feeBreakdown: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  feeLabelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  feeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  feeValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  feeValueMinus: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  feeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  feeTotal: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  feeTotalValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.success,
  },
  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    lineHeight: 20,
  },
});
