import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { X, Camera, CheckCircle, Shield } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface VerificationModalProps {
    visible: boolean;
    onClose: () => void;
    onVerified: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function VerificationModal({
    visible,
    onClose,
    onVerified,
}: VerificationModalProps) {
    const [step, setStep] = useState<'upload' | 'verifying' | 'success'>('upload');
    const [idImage, setIdImage] = useState<string | null>(null);

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 2],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIdImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking verification image:', error);
        }
    };

    const handleVerify = async () => {
        if (!idImage) return;

        setStep('verifying');

        // Simulate verification process (3 seconds)
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setStep('success');

        // Wait a moment then notify parent
        setTimeout(() => {
            onVerified();
            handleClose();
        }, 2000);
    };

    const handleClose = () => {
        setStep('upload');
        setIdImage(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Verify Your Identity</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {step === 'upload' && (
                        <View style={styles.content}>
                            <Shield size={48} color={colors.textPrimary} style={styles.icon} />
                            <Text style={styles.subtitle}>
                                Upload a clear photo of your government-issued ID
                            </Text>
                            <Text style={styles.description}>
                                This helps us verify your identity and keep the Raven community safe.
                            </Text>

                            {/* Image Preview or Upload Button */}
                            {idImage ? (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: idImage }} style={styles.preview} />
                                    <TouchableOpacity
                                        style={styles.changeButton}
                                        onPress={handlePickImage}
                                    >
                                        <Text style={styles.changeButtonText}>Change Photo</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                                    <Camera size={24} color={colors.textPrimary} />
                                    <Text style={styles.uploadButtonText}>Select ID Photo</Text>
                                </TouchableOpacity>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.submitButton, !idImage && styles.submitButtonDisabled]}
                                onPress={handleVerify}
                                disabled={!idImage}
                            >
                                <Text style={styles.submitButtonText}>Verify Now</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'verifying' && (
                        <View style={styles.content}>
                            <ActivityIndicator size="large" color={colors.textPrimary} />
                            <Text style={styles.verifyingText}>Verifying your identity...</Text>
                            <Text style={styles.verifyingSubtext}>
                                This usually takes a few seconds
                            </Text>
                        </View>
                    )}

                    {step === 'success' && (
                        <View style={styles.content}>
                            <View style={styles.successIcon}>
                                <CheckCircle size={64} color="#22C55E" />
                            </View>
                            <Text style={styles.successTitle}>You're Verified!</Text>
                            <Text style={styles.successText}>
                                Your profile now shows a verified badge
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.xl,
        color: colors.textPrimary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    icon: {
        marginBottom: spacing.lg,
    },
    subtitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    description: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    previewContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    preview: {
        width: '100%',
        height: 180,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.backgroundSecondary,
    },
    changeButton: {
        marginTop: spacing.sm,
    },
    changeButtonText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    uploadButton: {
        width: '100%',
        height: 120,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    uploadButtonText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
    submitButton: {
        width: '100%',
        backgroundColor: colors.textPrimary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textInverse,
    },
    verifyingText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginTop: spacing.xl,
    },
    verifyingSubtext: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    successIcon: {
        marginBottom: spacing.lg,
    },
    successTitle: {
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.fontSize['2xl'],
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    successText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
    },
});
