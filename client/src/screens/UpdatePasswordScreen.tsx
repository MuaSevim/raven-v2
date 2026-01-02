import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

export default function UpdatePasswordScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const canSubmit = currentPassword.length >= 6 && newPassword.length >= 8 && newPassword === confirmPassword;

    const handleUpdatePassword = async () => {
        if (!user || !canSubmit) return;

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email!, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            Alert.alert('Success', 'Password updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Error updating password:', error);

            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Current password is incorrect');
            } else if (error.code === 'auth/weak-password') {
                Alert.alert('Error', 'New password is too weak');
            } else if (error.code === 'auth/requires-recent-login') {
                Alert.alert('Error', 'Please sign out and sign in again, then try updating your password');
            } else {
                Alert.alert('Error', 'Failed to update password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Update Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.description}>
                        Enter your current password and choose a new one
                    </Text>

                    {/* Current Password */}
                    <Text style={styles.label}>Current Password</Text>
                    <View style={styles.inputContainer}>
                        <Lock size={20} color={colors.textTertiary} />
                        <TextInput
                            style={styles.input}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                            placeholderTextColor={colors.placeholder}
                            secureTextEntry={!showCurrentPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                            {showCurrentPassword ? (
                                <EyeOff size={20} color={colors.textTertiary} />
                            ) : (
                                <Eye size={20} color={colors.textTertiary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* New Password */}
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputContainer}>
                        <Lock size={20} color={colors.textTertiary} />
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor={colors.placeholder}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? (
                                <EyeOff size={20} color={colors.textTertiary} />
                            ) : (
                                <Eye size={20} color={colors.textTertiary} />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>Must be at least 8 characters</Text>

                    {/* Confirm Password */}
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputContainer}>
                        <Lock size={20} color={colors.textTertiary} />
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor={colors.placeholder}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                        />
                    </View>
                    {confirmPassword && newPassword !== confirmPassword && (
                        <Text style={styles.errorHint}>Passwords do not match</Text>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Update Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.updateButton, !canSubmit && styles.updateButtonDisabled]}
                    onPress={handleUpdatePassword}
                    disabled={!canSubmit || loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.textInverse} />
                    ) : (
                        <Text style={styles.updateButtonText}>Update Password</Text>
                    )}
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
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
    },
    description: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
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
    hint: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    errorHint: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: '#EF4444',
        marginTop: spacing.xs,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    updateButton: {
        backgroundColor: colors.textPrimary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    updateButtonDisabled: {
        opacity: 0.5,
    },
    updateButtonText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textInverse,
    },
});
