import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Camera,
  Trash2,
  BadgeCheck,
  ChevronDown,
  Search,
  X,
  Check,
  DollarSign,
  ChevronRight,
  Upload,
  Image as ImageIcon,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../store/useAuthStore";
import { colors, typography, spacing, borderRadius } from "../theme";
import { api } from "../utils/api";
import { invalidateCache } from "../utils/cache";
import { VerificationModal } from "../components/ui";
import { PHONE_COUNTRIES, PhoneCountry } from "../services/locationApi";
import { updateEmail, sendEmailVerification } from "firebase/auth";
import { normalizeText } from "../utils/text";
import { uploadAvatarImage } from "../services/storage";
import type { AuthMeResponse } from "../types/api";
import { actionCodeSettings } from "../services/actionCodeSettings";

// =============================================================================
// TYPES
// =============================================================================

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar: string | null;
  email: string;
  phone: string | null;
  phoneCode: string | null;
  isVerified: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Original values for change detection
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [originalPhoneCode, setOriginalPhoneCode] = useState("");
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);

  // Fetch profile
  const hasLoadedProfile = React.useRef(false);
  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        if (!user) return;
        // Only show full-screen loading on first load
        if (!hasLoadedProfile.current) setLoading(true);
        try {
          const data = await api.auth.me();
          const profile = data as AuthMeResponse;
          
          if (!profile) {
            console.warn('Profile not found, possibly due to database reset. Signing out...');
            await signOut();
            return;
          }

          const avatarUrl = profile.avatar || (profile as any).profilePicture || null;
          setProfile({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            avatar: avatarUrl,
            email: profile.email || "",
            phone: profile.phone || null,
            phoneCode: profile.phoneCode || "+1",
            isVerified: false,
          });
          setFirstName(profile.firstName || "");
          setLastName(profile.lastName || "");
          setEmail(profile.email || "");
          setPhone(profile.phone || "");
          setAvatar(avatarUrl);

          // Determine country code & phone code from what the DB actually has
          const storedCountryCode = (profile as any).countryCode;
          const storedPhoneCode = profile.phoneCode;

          // Step 1: Find the country entry
          let country: (typeof PHONE_COUNTRIES)[number] | undefined;

          // Prefer stored countryCode (e.g. "TR")
          if (storedCountryCode) {
            country = PHONE_COUNTRIES.find((c) => c.code === storedCountryCode);
          }

          // Fallback: look up by phone dial code
          if (!country && storedPhoneCode) {
            country = PHONE_COUNTRIES.find((c) => c.dialCode === storedPhoneCode);
          }

          // If we found a country but user has no phone code stored, auto-fill with that country's dial code
          const resolvedPhoneCode = storedPhoneCode || country?.dialCode || "+1";
          const resolvedCountryCode = country?.code || storedCountryCode || "US";

          setPhoneCode(resolvedPhoneCode);
          setCountryCode(resolvedCountryCode);

          setOriginalFirstName(profile.firstName || "");
          setOriginalLastName(profile.lastName || "");
          setOriginalEmail(profile.email || "");
          setOriginalPhone(profile.phone || "");
          setOriginalPhoneCode(profile.phoneCode || "+1");
          setOriginalAvatar(avatarUrl);
          hasLoadedProfile.current = true;
        } catch (err: Error | unknown) {
          console.error("Error fetching profile:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, [user])
  );

  const hasChanges =
    firstName !== originalFirstName ||
    lastName !== originalLastName ||
    email !== originalEmail ||
    phone !== originalPhone ||
    phoneCode !== originalPhoneCode ||
    avatar !== originalAvatar;

  const handleSave = async () => {
    if (!user || !hasChanges) return;
    setSaving(true);

    try {
      let avatarUrl = avatar;
      if (avatar && (avatar.startsWith("file://") || avatar.startsWith("content://") || avatar.startsWith("ph://"))) {
        avatarUrl = await uploadAvatarImage(user.uid, avatar);
      }

      // Update email in Firebase if changed
      let emailChanged = false;
      if (email !== originalEmail) {
        try {
          await updateEmail(user, email);
          await sendEmailVerification(user, actionCodeSettings);
          emailChanged = true;
        } catch (emailError: any) {
          if (emailError?.code === "auth/requires-recent-login") {
            Alert.alert(
              "Error",
              "Please sign out and sign in again to update your email"
            );
            setSaving(false);
            return;
          }
          // Show error but continue saving other fields
          Alert.alert(
            "Email Update Failed",
            emailError?.message || "Could not update email. Other changes will still be saved."
          );
        }
      }

      // Update profile in backend
      const avatarPayload = avatarUrl === null ? '' : avatarUrl;
      await api.auth.updateProfile({
        firstName,
        lastName,
        email: emailChanged ? email : originalEmail,
        phone,
        phoneCode,
        countryCode,
        avatar: avatarPayload,
      });

      // Invalidate cached profile so next read gets fresh data
      invalidateCache('auth:me');

      // Update local "original" state so hasChanges resets to false
      setOriginalFirstName(firstName);
      setOriginalLastName(lastName);
      if (emailChanged) setOriginalEmail(email);
      setOriginalPhone(phone);
      setOriginalPhoneCode(phoneCode);
      setOriginalAvatar(avatarUrl || null);
      setAvatar(avatarUrl || null);

      // Show success — stay on current screen (no navigation)
      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      const message = err?.message || "Failed to update profile";
      Alert.alert("Error", String(message));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (err) {
            console.error("Sign out error:", err);
          }
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant permission to access your photo library to upload an avatar.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera permission to take photos.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
  };

  const showImageOptions = () => {
    const options = [
      { text: 'Take Photo', onPress: () => setTimeout(handleTakePhoto, 100) },
      { text: 'Choose from Library', onPress: () => setTimeout(handlePickImage, 100) },
    ];
    
    if (avatar) {
      options.push({ text: 'Remove Photo', onPress: handleRemoveAvatar, style: 'destructive' } as any);
    }
    
    options.push({ text: 'Cancel', style: 'cancel' } as any);
    
    Alert.alert('Profile Photo', 'Choose how you want to add your photo', options);
  };

  // Format phone number like (000) 000-0000
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setPhone(cleaned);
  };

  const handleVerificationComplete = () => {
    setShowVerifyModal(false);
    setProfile((prev) => (prev ? { ...prev, isVerified: true } : prev));
    Alert.alert(
      "🎉 Verified!",
      "Your account is now verified. You will see a verified badge on your profile."
    );
  };

  const getInitial = () => {
    if (firstName && lastName)
      return (
        firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase()
      );
    if (profile?.email) return profile.email.charAt(0).toUpperCase();
    return "?";
  };

  const handleSelectCountry = (country: PhoneCountry) => {
    setCountryCode(country.code);
    setPhoneCode(country.dialCode);
    setShowCountryPicker(false);
    setSearchQuery("");
  };

  const filteredCountries = useMemo(() => {
    if (!showCountryPicker) return [];
    const normalizedQuery = normalizeText(searchQuery);
    return PHONE_COUNTRIES.filter(
      (country) =>
        normalizeText(country.name).includes(normalizedQuery) ||
        country.dialCode.includes(searchQuery) ||
        normalizeText(country.code).includes(normalizedQuery)
    );
  }, [showCountryPicker, searchQuery]);

  const selectedCountry = PHONE_COUNTRIES.find((c) => c.code === countryCode);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {hasChanges ? (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showImageOptions}
            activeOpacity={0.8}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitial()}</Text>
              </View>
            )}
            <View style={styles.editAvatarBtn}>
              <Camera size={16} color={colors.textInverse} />
            </View>
            {profile?.isVerified && (
              <View style={styles.verifiedBadge}>
                <BadgeCheck size={20} color="#22C55E" fill="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputContainer}>
            <User size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputContainer}>
            <User size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.countryFlag}>{selectedCountry?.flag}</Text>
              <Text style={styles.countryCode}>
                {selectedCountry?.dialCode || phoneCode}
              </Text>
              <ChevronDown size={16} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.phoneInputContainer}>
              <Phone size={20} color={colors.textTertiary} />
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
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Earnings")}
          >
            <Text style={styles.actionButtonText}>Statistics</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("UpdatePassword")}
          >
            <Text style={styles.actionButtonText}>Update Password</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Search size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search countries..."
                placeholderTextColor={colors.placeholder}
                autoCorrect={false}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => handleSelectCountry(item)}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.dialCode}</Text>
                  {item.code === countryCode && (
                    <Check size={20} color={colors.textPrimary} />
                  )}
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Verification Modal */}
      <VerificationModal
        visible={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerified={handleVerificationComplete}
      />
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  saveButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 40,
    color: colors.textPrimary,
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  verifiedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  removeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeAvatarText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: "#EF4444",
  },
  form: {
    marginTop: spacing.sm,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  phoneRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryCode: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  actionButtons: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionButtonText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  hintContainer: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  hintText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  signOutButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  signOutText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: "#EF4444",
  },
  bottomPadding: {
    height: spacing.xl * 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: "80%",
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryItemFlag: {
    fontSize: 24,
  },
  countryItemName: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  countryItemCode: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Avatar Modal
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  avatarModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === "ios" ? spacing.xl * 2 : spacing.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  avatarModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  avatarModalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  avatarModalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  avatarModalOptionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  avatarModalCancel: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  avatarModalCancelText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
});
