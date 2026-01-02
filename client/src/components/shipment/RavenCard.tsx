import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MessageCircle, BadgeCheck } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface RavenCardProps {
    user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        isVerified: boolean;
    };
    onPress: () => void;
    onChatPress: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RavenCard({ user, onPress, onChatPress }: RavenCardProps) {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Raven';
    const initials = `${(user.firstName || 'R')[0]}${(user.lastName || '')[0] || ''}`;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Raven</Text>

            <View style={styles.content}>
                <TouchableOpacity style={styles.userInfo} onPress={onPress} activeOpacity={0.7}>
                    {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    )}
                    <View style={styles.nameContainer}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{fullName}</Text>
                            {user.isVerified && (
                                <BadgeCheck size={16} color={colors.textPrimary} fill={colors.background} />
                            )}
                        </View>
                        <Text style={styles.subtitle}>Tap to view profile</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.chatButton} onPress={onChatPress}>
                    <MessageCircle size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    title: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.border,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textInverse,
    },
    nameContainer: {
        flex: 1,
        marginLeft: spacing.md,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    name: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    subtitle: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
        marginTop: 2,
    },
    chatButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
