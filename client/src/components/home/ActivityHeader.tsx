import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ActivityHeaderProps {
    title: string;
    unreadCount: number;
    onInboxPress: () => void;
    onSeeAllPress?: () => void;
    showSeeAll?: boolean;
}

export default function ActivityHeader({
    title,
    unreadCount,
    onInboxPress,
    onSeeAllPress,
    showSeeAll = false,
}: ActivityHeaderProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.rightSection}>
                {showSeeAll && onSeeAllPress && (
                    <TouchableOpacity onPress={onSeeAllPress} style={styles.seeAllButton}>
                        <Text style={styles.seeAllText}>See all</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.inboxButton} onPress={onInboxPress}>
                    <MessageCircle size={24} color={colors.textPrimary} strokeWidth={1.5} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    seeAllButton: {
        paddingVertical: spacing.xs,
    },
    seeAllText: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    inboxButton: {
        position: 'relative',
        padding: spacing.xs,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.textPrimary,
        borderRadius: borderRadius.full,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 10,
        color: colors.textInverse,
    },
});
