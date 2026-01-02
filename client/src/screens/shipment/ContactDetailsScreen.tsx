import React, { useReducer, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Mail, ChevronDown, Search, X, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useShipmentStore } from '../../store/useShipmentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { StepHeader, BottomButton } from '../../components/shipment/StepComponents';
import { PHONE_COUNTRIES, PhoneCountry } from '../../services/locationApi';
import { API_URL } from '../../config';

// =============================================================================
// TYPES
// =============================================================================

type State = {
  // Sender fields
  fullName: string;
  email: string;
  phone: string;
  phoneCode: string;
  countryCode: string;

  // Receiver fields
  receiverName: string;
  receiverPhone: string;
  receiverPhoneCode: string;
  receiverCountryCode: string;

  // Profile data
  profilePhone: string | null;
  profilePhoneCode: string | null;

  // UI state
  showCountryPicker: boolean;
  activeField: 'sender' | 'receiver';
  searchQuery: string;
};

type Action =
  | { type: 'SET_FULL_NAME'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PHONE'; payload: string }
  | { type: 'SET_PHONE_CODE'; payload: string }
  | { type: 'SET_COUNTRY_CODE'; payload: string }
  | { type: 'SET_RECEIVER_NAME'; payload: string }
  | { type: 'SET_RECEIVER_PHONE'; payload: string }
  | { type: 'SET_RECEIVER_PHONE_CODE'; payload: string }
  | { type: 'SET_RECEIVER_COUNTRY_CODE'; payload: string }
  | { type: 'SET_PROFILE_PHONE'; payload: { phone: string | null; phoneCode: string | null } }
  | { type: 'SET_SHOW_COUNTRY_PICKER'; payload: boolean }
  | { type: 'SET_ACTIVE_FIELD'; payload: 'sender' | 'receiver' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SELECT_COUNTRY'; payload: PhoneCountry }
  | { type: 'INIT_FROM_DRAFT'; payload: Partial<State> };

// =============================================================================
// REDUCER
// =============================================================================

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FULL_NAME':
      return { ...state, fullName: action.payload };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_PHONE':
      return { ...state, phone: action.payload };
    case 'SET_PHONE_CODE':
      return { ...state, phoneCode: action.payload };
    case 'SET_COUNTRY_CODE':
      return { ...state, countryCode: action.payload };
    case 'SET_RECEIVER_NAME':
      return { ...state, receiverName: action.payload };
    case 'SET_RECEIVER_PHONE':
      return { ...state, receiverPhone: action.payload };
    case 'SET_RECEIVER_PHONE_CODE':
      return { ...state, receiverPhoneCode: action.payload };
    case 'SET_RECEIVER_COUNTRY_CODE':
      return { ...state, receiverCountryCode: action.payload };
    case 'SET_PROFILE_PHONE':
      return { ...state, profilePhone: action.payload.phone, profilePhoneCode: action.payload.phoneCode };
    case 'SET_SHOW_COUNTRY_PICKER':
      return { ...state, showCountryPicker: action.payload };
    case 'SET_ACTIVE_FIELD':
      return { ...state, activeField: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SELECT_COUNTRY':
      if (state.activeField === 'sender') {
        return {
          ...state,
          countryCode: action.payload.code,
          phoneCode: action.payload.dialCode,
          showCountryPicker: false,
          searchQuery: '',
        };
      } else {
        return {
          ...state,
          receiverCountryCode: action.payload.code,
          receiverPhoneCode: action.payload.dialCode,
          showCountryPicker: false,
          searchQuery: '',
        };
      }
    case 'INIT_FROM_DRAFT':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ContactDetailsScreen() {
  const navigation = useNavigation<any>();
  const { draft, setDraft, totalSteps } = useShipmentStore();
  const { user } = useAuthStore();

  const [state, dispatch] = useReducer(reducer, {
    fullName: draft.senderFullName || '',
    email: draft.senderEmail || user?.email || '',
    phone: draft.senderPhone || '',
    phoneCode: draft.senderPhoneCode || '+1',
    countryCode: draft.senderCountryCode || 'US',
    receiverName: draft.receiverFullName || '',
    receiverPhone: draft.receiverPhone || '',
    receiverPhoneCode: draft.receiverPhoneCode || '+1',
    receiverCountryCode: 'US',
    profilePhone: null,
    profilePhoneCode: null,
    showCountryPicker: false,
    activeField: 'sender',
    searchQuery: '',
  });

  const selectedCountry = PHONE_COUNTRIES.find(c => c.code === state.countryCode) || PHONE_COUNTRIES[0];
  const selectedReceiverCountry = PHONE_COUNTRIES.find(c => c.code === state.receiverCountryCode) || PHONE_COUNTRIES[0];

  // Fetch user profile to pre-fill phone
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          dispatch({
            type: 'SET_PROFILE_PHONE',
            payload: { phone: data.phone || null, phoneCode: data.phoneCode || null },
          });

          // Pre-fill if not already filled
          if (!draft.senderPhone && data.phone) {
            dispatch({ type: 'SET_PHONE', payload: data.phone });
            dispatch({ type: 'SET_PHONE_CODE', payload: data.phoneCode || '+1' });
          }

          // Pre-fill Name if not already filled
          if (!state.fullName && data.firstName && data.lastName) {
            dispatch({ type: 'SET_FULL_NAME', payload: `${data.firstName} ${data.lastName}`.trim() });
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, [user]);

  const canProceed =
    state.fullName.length >= 2 &&
    state.email.includes('@') &&
    state.phone.length >= 7 &&
    state.receiverName.length >= 2 &&
    state.receiverPhone.length >= 7;

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    dispatch({ type: 'SET_PHONE', payload: cleaned });
  };

  const handleReceiverPhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    dispatch({ type: 'SET_RECEIVER_PHONE', payload: cleaned });
  };

  const handleNext = async () => {
    // Check if phone number changed from profile
    const phoneChanged = state.profilePhone && state.phone !== state.profilePhone;
    const phoneIsNew = !state.profilePhone && state.phone;

    if (phoneChanged) {
      Alert.alert(
        'Update Contact Number',
        'Do you want to change your primary contact number?',
        [
          {
            text: 'No, just for this shipment',
            onPress: () => proceedToNext(),
          },
          {
            text: 'Yes, update my profile',
            onPress: async () => {
              await updateProfilePhone();
              proceedToNext();
            },
          },
        ]
      );
    } else if (phoneIsNew) {
      Alert.alert(
        'Save Contact Number',
        'Do you want to save this number as your primary contact?',
        [
          {
            text: 'No',
            onPress: () => proceedToNext(),
          },
          {
            text: 'Yes',
            onPress: async () => {
              await updateProfilePhone();
              proceedToNext();
            },
          },
        ]
      );
    } else {
      proceedToNext();
    }
  };

  const updateProfilePhone = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.phone, phoneCode: state.phoneCode }),
      });
    } catch (err) {
      console.error('Error updating profile phone:', err);
    }
  };

  const proceedToNext = () => {
    setDraft({
      senderFullName: state.fullName,
      senderEmail: state.email,
      senderPhone: state.phone,
      senderPhoneCode: state.phoneCode,
      senderCountryCode: state.countryCode,
      receiverFullName: state.receiverName,
      receiverPhone: state.receiverPhone,
      receiverPhoneCode: state.receiverPhoneCode,
    });
    navigation.navigate('ReviewShipment');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('MainTabs');
  };

  const filteredCountries = PHONE_COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      country.dialCode.includes(state.searchQuery) ||
      country.code.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Contact Details"
        currentStep={5}
        totalSteps={totalSteps}
        onClose={handleClose}
        onBack={handleBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
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
              value={state.fullName}
              onChangeText={(text) => dispatch({ type: 'SET_FULL_NAME', payload: text })}
              placeholder="John Doe"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.textTertiary} strokeWidth={1.5} />
            <TextInput
              style={styles.input}
              value={state.email}
              onChangeText={(text) => dispatch({ type: 'SET_EMAIL', payload: text })}
              placeholder="john@example.com"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => {
                dispatch({ type: 'SET_ACTIVE_FIELD', payload: 'sender' });
                dispatch({ type: 'SET_SHOW_COUNTRY_PICKER', payload: true });
              }}
            >
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <Text style={styles.dialCode}>{state.phoneCode}</Text>
              <ChevronDown size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.phoneInputContainer}>
              <Phone size={20} color={colors.textTertiary} strokeWidth={1.5} />
              <TextInput
                style={styles.phoneInput}
                value={formatPhoneNumber(state.phone)}
                onChangeText={handlePhoneChange}
                placeholder="(000) 000-0000"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
                maxLength={20}
              />
            </View>
          </View>

          {/* Receiver Section */}
          <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
            <User size={20} color={colors.textPrimary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Receiver Information</Text>
          </View>

          <Text style={styles.hint}>
            Person who will receive the package at destination
          </Text>

          {/* Receiver Name */}
          <Text style={styles.label}>Receiver's Full Name</Text>
          <View style={styles.inputContainer}>
            <User size={20} color={colors.textTertiary} strokeWidth={1.5} />
            <TextInput
              style={styles.input}
              value={state.receiverName}
              onChangeText={(text) => dispatch({ type: 'SET_RECEIVER_NAME', payload: text })}
              placeholder="Receiver's full name"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
            />
          </View>

          {/* Receiver Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => {
                dispatch({ type: 'SET_ACTIVE_FIELD', payload: 'receiver' });
                dispatch({ type: 'SET_SHOW_COUNTRY_PICKER', payload: true });
              }}
            >
              <Text style={styles.flag}>{selectedReceiverCountry.flag}</Text>
              <Text style={styles.dialCode}>{state.receiverPhoneCode}</Text>
              <ChevronDown size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.phoneInputContainer}>
              <Phone size={20} color={colors.textTertiary} strokeWidth={1.5} />
              <TextInput
                style={styles.phoneInput}
                value={formatPhoneNumber(state.receiverPhone)}
                onChangeText={handleReceiverPhoneChange}
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
      </KeyboardAvoidingView>

      <BottomButton
        label="Review Shipment"
        onPress={handleNext}
        disabled={!canProceed}
      />

      {/* Country Picker Modal */}
      <Modal
        visible={state.showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => dispatch({ type: 'SET_SHOW_COUNTRY_PICKER', payload: false })}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity
              onPress={() => {
                dispatch({ type: 'SET_SHOW_COUNTRY_PICKER', payload: false });
                dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
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
              value={state.searchQuery}
              onChangeText={(text) => dispatch({ type: 'SET_SEARCH_QUERY', payload: text })}
              autoFocus
            />
            {state.searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}>
                <X size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => dispatch({ type: 'SELECT_COUNTRY', payload: item })}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <View style={styles.countryInfo}>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                </View>
                {((state.activeField === 'sender' && item.code === state.countryCode) ||
                  (state.activeField === 'receiver' && item.code === state.receiverCountryCode)) && (
                    <Check size={20} color={colors.textPrimary} />
                  )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.base, color: colors.textPrimary },
  hint: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  label: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, gap: spacing.sm },
  input: { flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textPrimary, paddingVertical: spacing.md },
  phoneRow: { flexDirection: 'row', gap: spacing.sm },
  countrySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, gap: spacing.xs },
  flag: { fontSize: 24 },
  dialCode: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.sm, color: colors.textPrimary },
  phoneInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, gap: spacing.sm },
  phoneInput: { flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textPrimary, paddingVertical: spacing.md },
  privacyNote: { backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg, padding: spacing.md, marginTop: spacing.lg },
  privacyText: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.textPrimary },
  modalCloseBtn: { padding: spacing.xs },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, margin: spacing.lg, gap: spacing.sm },
  searchInput: { flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.base, color: colors.textPrimary, paddingVertical: spacing.md },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  countryFlag: { fontSize: 28 },
  countryInfo: { flex: 1 },
  countryName: { fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.base, color: colors.textPrimary },
  countryDialCode: { fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 2 },
});
