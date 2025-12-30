import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Mail, ChevronDown, Search, X, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StepHeader, BottomButton } from '../../components/shipment/StepComponents';
import { useShipmentStore } from '../../store/useShipmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { PHONE_COUNTRIES, PhoneCountry } from '../../services/locationApi';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function ContactDetailsScreen() {
  const navigation = useNavigation<any>();
  const { draft, setDraft, totalSteps } = useShipmentStore();
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState(draft.senderFullName || '');
  const [email, setEmail] = useState(draft.senderEmail || user?.email || '');
  const [phone, setPhone] = useState(draft.senderPhone || '');
  const [phoneCode, setPhoneCode] = useState(draft.senderPhoneCode || '+1');
  const [countryCode, setCountryCode] = useState(draft.senderCountryCode || 'US');

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = PHONE_COUNTRIES.find(c => c.code === countryCode) || PHONE_COUNTRIES[0];

  const canProceed = fullName.length >= 2 && email.includes('@') && phone.length >= 6;

  const handleSelectCountry = (country: PhoneCountry) => {
    setCountryCode(country.code);
    setPhoneCode(country.dialCode);
    setShowCountryPicker(false);
    setSearchQuery('');
  };

  const filteredCountries = searchQuery
    ? PHONE_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : PHONE_COUNTRIES;

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    // Format as user types
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setPhone(cleaned);
  };

  const handleNext = () => {
    setDraft({
      senderFullName: fullName,
      senderEmail: email,
      senderPhone: phone,
      senderPhoneCode: phoneCode,
      senderCountryCode: countryCode,
    });
    navigation.navigate('ReviewShipment');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Contact Details"
        currentStep={6}
        totalSteps={totalSteps}
        onClose={handleClose}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionHeader}>
          <User size={20} color={colors.textPrimary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Your Contact Information</Text>
        </View>

        <Text style={styles.hint}>
          This information will be shared with the traveler for coordination
        </Text>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputContainer}>
          <User size={20} color={colors.textTertiary} strokeWidth={1.5} />
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Mail size={20} color={colors.textTertiary} strokeWidth={1.5} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Phone Number */}
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={styles.dialCode}>{phoneCode}</Text>
            <ChevronDown size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.phoneInputContainer}>
            <Phone size={20} color={colors.textTertiary} strokeWidth={1.5} />
            <TextInput
              style={styles.phoneInput}
              value={formatPhoneNumber(phone)}
              onChangeText={handlePhoneChange}
              placeholder="(000) 000-0000"
              placeholderTextColor={colors.placeholder}
              keyboardType="number-pad"
              maxLength={20}
            />
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Your contact details are secure and will only be shared with matched travelers.
          </Text>
        </View>
      </ScrollView>

      <BottomButton
        label="Review Shipment"
        onPress={handleNext}
        disabled={!canProceed}
      />

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              onPress={() => {
                setShowCountryPicker(false);
                setSearchQuery('');
              }}
              style={styles.modalCloseBtn}
            >
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  item.code === countryCode && styles.countryItemSelected,
                ]}
                onPress={() => handleSelectCountry(item)}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <View style={styles.countryInfo}>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                </View>
                {item.code === countryCode && (
                  <Check size={20} color={colors.textPrimary} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.countryList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
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
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  // Phone
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    minHeight: 56,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 56,
  },
  phoneInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  privacyNote: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  privacyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  countryList: {
    paddingHorizontal: spacing.lg,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  countryItemSelected: {
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  countryDialCode: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
