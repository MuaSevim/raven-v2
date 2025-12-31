import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, User, Mail, Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/useAuthStore';
import { colors, typography, spacing, borderRadius } from '../theme';
import { API_URL } from '../config';

interface UserProfile {
    firstName: string;
    lastName: string;
    avatar: string | null;
    email: string;
}

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Original values for change detection
    const [originalFirstName, setOriginalFirstName] = useState('');
    const [originalLastName, setOriginalLastName] = useState('');
    const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);

    // Fetch current profile
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                if (!user) return;

                try {
                    const token = await user.getIdToken();
                    const response = await fetch(`${API_URL}/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setProfile(data);
                        setFirstName(data.firstName || '');
                        setLastName(data.lastName || '');
                        setAvatar(data.avatar || null);

                        // Store original values
                        setOriginalFirstName(data.firstName || '');
                        setOriginalLastName(data.lastName || '');
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

    // Check if anything has changed
    const hasChanges =
        firstName !== originalFirstName ||
        lastName !== originalLastName ||
        avatar !== originalAvatar;

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library to change your avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleRemoveAvatar = () => {
        Alert.alert(
            'Remove Avatar',
            'Are you sure you want to remove your profile picture?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => setAvatar(null) },
            ]
        );
    };

    const handleSave = async () => {
        if (!firstName.trim()) {
            Alert.alert('Error', 'Please enter your first name');
            return;
        }

        setSaving(true);
        try {
            const token = await user?.getIdToken();

            // In a real app, you'd upload the image to a storage service first
            // For now, we'll just save the profile data
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    // In production, this would be the uploaded image URL
                    avatar: avatar,
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Profile updated successfully');
                // Update original values
                setOriginalFirstName(firstName);
                setOriginalLastName(lastName);
                setOriginalAvatar(avatar);
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const getInitial = () => {
        if (firstName) return firstName.charAt(0).toUpperCase();
        if (profile?.email) return profile.email.charAt(0).toUpperCase();
        return '?';
    };

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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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

            <ScrollView style={styles.content}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{getInitial()}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.editAvatarBtn}
                            onPress={handlePickImage}
                        >
                            <Camera size={16} color={colors.textInverse} />
                        </TouchableOpacity>
                    </View>

                    {avatar && (
                        <TouchableOpacity
                            style={styles.removeAvatarBtn}
                            onPress={handleRemoveAvatar}
                        >
                            <Trash2 size={14} color="#EF4444" />
                            <Text style={styles.removeAvatarText}>Remove photo</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.emailText}>{profile?.email}</Text>
                </View>

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

                    <Text style={styles.label}>Email (Read Only)</Text>
                    <View style={[styles.inputContainer, styles.disabledInput]}>
                        <Mail size={20} color={colors.textTertiary} />
                        <TextInput
                            style={[styles.input, { color: colors.textSecondary }]}
                            value={profile?.email || ''}
                            editable={false}
                        />
                    </View>
                </View>

                {!hasChanges && (
                    <View style={styles.hintContainer}>
                        <Text style={styles.hintText}>
                            Make changes to see the Save button
                        </Text>
                    </View>
                )}
            </ScrollView>
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
    saveButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        minWidth: 50,
        alignItems: 'center',
    },
    saveButtonText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: spacing.md,
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
        backgroundColor: colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 40,
        color: colors.textInverse,
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
        borderWidth: 3,
        borderColor: colors.background,
    },
    removeAvatarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    removeAvatarText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: '#EF4444',
    },
    emailText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    form: {
        paddingHorizontal: spacing.lg,
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
    disabledInput: {
        opacity: 0.6,
    },
    hintContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    hintText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
    },
});
