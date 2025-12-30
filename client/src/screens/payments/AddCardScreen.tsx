import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

// Card type detection
function detectCardType(number: string): string {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  return 'unknown';
}

// Format card number with spaces
function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

// Format expiry as MM/YY
function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
  }
  return cleaned;
}

export default function AddCardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [saving, setSaving] = useState(false);

  const cardType = detectCardType(cardNumber);
  const isValid = 
    cardNumber.replace(/\s/g, '').length >= 15 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cardholderName.trim().length >= 2;

  const handleCardNumberChange = (value: string) => {
    setCardNumber(formatCardNumber(value));
  };

  const handleExpiryChange = (value: string) => {
    // Handle backspace on the slash
    if (value.length < expiry.length && expiry.endsWith('/')) {
      setExpiry(value.replace(/\D/g, ''));
      return;
    }
    setExpiry(formatExpiry(value));
  };

  const handleSave = async () => {
    if (!isValid || !user) return;
    
    setSaving(true);
    
    try {
      const token = await user.getIdToken();
      
      // Parse expiry
      const [monthStr, yearStr] = expiry.split('/');
      const expiryMonth = parseInt(monthStr, 10);
      const expiryYear = parseInt('20' + yearStr, 10);
      
      const response = await fetch(`${API_URL}/payments/methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryMonth,
          expiryYear,
          cvv,
          cardHolder: cardholderName.trim(),
          setAsDefault,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save card');
      }
      
      Alert.alert('Success', 'Card added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Error saving card:', err);
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Card</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Preview */}
          <View style={styles.cardPreview}>
            <View style={styles.cardGradient}>
              <View style={styles.cardTop}>
                <CreditCard size={32} color="rgba(255,255,255,0.8)" />
                <Text style={styles.cardTypeText}>
                  {cardType !== 'unknown' ? cardType.toUpperCase() : ''}
                </Text>
              </View>
              <Text style={styles.cardNumberPreview}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardLabel}>CARDHOLDER</Text>
                  <Text style={styles.cardValue}>
                    {cardholderName.toUpperCase() || 'YOUR NAME'}
                  </Text>
                </View>
                <View style={styles.cardExpiry}>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>{expiry || 'MM/YY'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <View style={styles.inputWrapper}>
                <CreditCard size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.textTertiary}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.inputSimple}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textTertiary}
                  value={expiry}
                  onChangeText={handleExpiryChange}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>CVV</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="•••"
                    placeholderTextColor={colors.textTertiary}
                    value={cvv}
                    onChangeText={(v) => setCvv(v.replace(/\D/g, '').substring(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name</Text>
              <TextInput
                style={styles.inputSimple}
                placeholder="John Doe"
                placeholderTextColor={colors.textTertiary}
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity 
              style={styles.defaultToggle}
              onPress={() => setSetAsDefault(!setAsDefault)}
            >
              <View style={[styles.checkbox, setAsDefault && styles.checkboxChecked]}>
                {setAsDefault && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.defaultText}>Set as default payment method</Text>
            </TouchableOpacity>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Lock size={16} color={colors.textTertiary} />
            <Text style={styles.securityText}>
              Your card information is encrypted and stored securely. We never store your CVV.
            </Text>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save Card</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  cardPreview: {
    marginBottom: spacing.xl,
  },
  cardGradient: {
    backgroundColor: '#1a1a2e',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    aspectRatio: 1.6,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTypeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  cardNumberPreview: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 22,
    color: '#fff',
    letterSpacing: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  cardValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#fff',
  },
  cardExpiry: {
    alignItems: 'flex-end',
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  inputSimple: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.textPrimary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.background,
  },
  defaultText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
  },
  securityText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
});
