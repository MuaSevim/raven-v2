import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, User, Mail, Phone, Camera, Trash2, BadgeCheck, ChevronDown, Search, X, Check, DollarSign, ChevronRight, Upload, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/useAuthStore';
import { colors, typography, spacing, borderRadius } from '../theme';
import { API_URL } from '../config';
import { VerificationModal } from '../components/ui';
import { PHONE_COUNTRIES, PhoneCountry } from '../services/locationApi';
import { updateEmail } from 'firebase/auth';

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

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('+1');
    const [countryCode, setCountryCode] = useState('US');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Original values for change detection
    const [originalFirstName, setOriginalFirstName] = useState('');
    const [originalLastName, setOriginalLastName] = useState('');
    const [originalEmail, setOriginalEmail] = useState('');
    const [originalPhone, setOriginalPhone] = useState('');
    const [originalPhoneCode, setOriginalPhoneCode] = useState('+1');
    const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);

    // Fetch profile
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                if (!user) return;
                try {
                    const token = await user.getIdToken();
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setProfile(data);
                        setFirstName(data.firstName || '');
                        setLastName(data.lastName || '');
                        setEmail(data.email || '');
                        setPhone(data.phone || '');
                        setPhoneCode(data.phoneCode || '+1');
                        setAvatar(data.avatar || null);

                        // Find country code from phone code
                        // Prefer US for +1 if ambiguous, as we don't store ISO code in DB yet
                        let country = PHONE_COUNTRIES.find(c => c.dialCode === (data.phoneCode || '+1'));
                        if (data.phoneCode === '+1' || !data.phoneCode) {
                            const us = PHONE_COUNTRIES.find(c => c.code === 'US');
                            if (us) country = us;
                        }

                        setCountryCode(country?.code || 'US');

                        setOriginalFirstName(data.firstName || '');
                        setOriginalLastName(data.lastName || '');
                        setOriginalEmail(data.email || '');
                        setOriginalPhone(data.phone || '');
                        setOriginalPhoneCode(data.phoneCode || '+1');
                        setOriginalAvatar(data.avatar || null);
                    }
                } catch (err) {
                    console.error('Error fetching profile:', err);
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
            const token = await user.getIdToken();

            // Update email in Firebase if changed
            if (email !== originalEmail) {
                try {
                    await updateEmail(user, email);
                } catch (emailError: any) {
                    if (emailError.code === 'auth/requires-recent-login') {
                        Alert.alert('Error', 'Please sign out and sign in again to update your email');
                        setSaving(false);
                        return;
                    }
                    throw emailError;
                }
            }

            // Update profile in backend
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, phone, phoneCode, avatar }),
            });

            if (!res.ok) throw new Error('Failed to update profile');

            Alert.alert('Success', 'Profile updated successfully');
            setOriginalFirstName(firstName);
            setOriginalLastName(lastName);
            setOriginalEmail(email);
            setOriginalPhone(phone);
            setOriginalPhoneCode(phoneCode);
            setOriginalAvatar(avatar);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (err) {
                            console.error('Sign out error:', err);
                        }
                    },
                },
            ]
        );
    };

    const handlePickImage = async () => {
        // Request permission first
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Please grant permission to access your photo library to upload an avatar.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
    };

    const handleVerificationComplete = () => {
        setShowVerifyModal(false);
        setProfile((prev) => prev ? { ...prev, isVerified: true } : prev);
        Alert.alert('🎉 Verified!', 'Your account is now verified. You will see a verified badge on your profile.');
    };

    const getInitial = () => {
        if (firstName && lastName) return firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
        if (profile?.email) return profile.email.charAt(0).toUpperCase();
        return '?';
    };

    const handleSelectCountry = (country: PhoneCountry) => {
        setCountryCode(country.code);
        setPhoneCode(country.dialCode);
        setShowCountryPicker(false);
        setSearchQuery('');
    };

    const filteredCountries = PHONE_COUNTRIES.filter(
        (country) =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.dialCode.includes(searchQuery) ||
            country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                {hasChanges ? (
                    <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
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
                        onPress={() => setShowAvatarModal(true)}
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
                            <Text style={styles.countryCode}>{selectedCountry?.dialCode || phoneCode}</Text>
                            <ChevronDown size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                        <View style={styles.phoneInputContainer}>
                            <Phone size={20} color={colors.textTertiary} />
                            <TextInput
                                style={styles.phoneInput}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="000 000 0000"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Earnings')}
                    >
                        <Text style={styles.actionButtonText}>Statistics</Text>
                        <ChevronRight size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('UpdatePassword')}
                    >
                        <Text style={styles.actionButtonText}>Update Password</Text>
                        <ChevronRight size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Sign Out */}
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                >
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Country Picker Modal */}
            <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={() => setShowCountryPicker(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

            {/* Avatar Action Modal */}
            <Modal
                visible={showAvatarModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAvatarModal(false)}
            >
                <TouchableOpacity
                    style={styles.avatarModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAvatarModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.avatarModalContent}>
                            <View style={styles.avatarModalHandle} />

                            <Text style={styles.avatarModalTitle}>Profile Photo</Text>

                            <TouchableOpacity
                                style={styles.avatarModalOption}
                                onPress={() => {
                                    setShowAvatarModal(false);
                                    handlePickImage();
                                }}
                                activeOpacity={0.7}
                            >
                                {avatar ? (
                                    <ImageIcon size={22} color={colors.textPrimary} />
                                ) : (
                                    <Upload size={22} color={colors.textPrimary} />
                                )}
                                <Text style={styles.avatarModalOptionText}>
                                    {avatar ? 'Change Photo' : 'Upload Photo'}
                                </Text>
                            </TouchableOpacity>

                            {avatar && (
                                <TouchableOpacity
                                    style={styles.avatarModalOption}
                                    onPress={() => {
                                        setShowAvatarModal(false);
                                        handleRemoveAvatar();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Trash2 size={22} color="#EF4444" />
                                    <Text style={[styles.avatarModalOptionText, { color: '#EF4444' }]}>
                                        Remove Photo
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.avatarModalCancel}
                                onPress={() => setShowAvatarModal(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.avatarModalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
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
        alignItems: 'center',
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    avatarContainer: {
        position: 'relative',
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 40,
        color: colors.textPrimary,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    verifiedBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12
    },
    removeAvatarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    removeAvatarText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: '#EF4444'
    },
    form: {
        marginTop: spacing.sm
    },
    label: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    inputContainer: {
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
        flexDirection: 'row',
        alignItems: 'center',
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
        flexDirection: 'row',
        alignItems: 'center',
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
        alignItems: 'center',
        marginTop: spacing.lg
    },
    hintText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary
    },
    signOutButton: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    signOutText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: '#EF4444',
    },
    bottomPadding: {
        height: spacing.xl * 2
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
        paddingTop: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        flexDirection: 'row',
        alignItems: 'center',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    avatarModalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl * 2 : spacing.xl,
        paddingTop: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    avatarModalHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    avatarModalTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    avatarModalOption: {
        flexDirection: 'row',
        alignItems: 'center',
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
        alignItems: 'center',
    },
    avatarModalCancelText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
});
