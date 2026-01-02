import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle, Package, XCircle, Plane, HandHeart, Send } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface StatusBadgeProps {
    status: string;
    size?: 'small' | 'medium';
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; Icon: any }> = {
    OPEN: { bg: '#FFF3E0', text: '#FF9800', label: 'OPEN', Icon: Clock },
    MATCHED: { bg: '#E3F2FD', text: '#1976D2', label: 'MATCHED', Icon: CheckCircle },
    HANDED_OVER: { bg: '#E8EAF6', text: '#5C6BC0', label: 'HANDED', Icon: HandHeart },
    ON_WAY: { bg: '#E8F5E9', text: '#4CAF50', label: 'ON WAY', Icon: Plane },
    DELIVERED: { bg: '#F5F5F5', text: '#4CAF50', label: 'DONE', Icon: CheckCircle },
    CANCELLED: { bg: '#FFEBEE', text: '#F44336', label: 'CANCELLED', Icon: XCircle },
    PENDING: { bg: '#FFF8E1', text: '#FFA000', label: 'PENDING', Icon: Clock },
    OFFER_MADE: { bg: '#F3E8FF', text: '#8B5CF6', label: 'OFFER MADE', Icon: Send },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
    const { Icon } = config;
    const isSmall = size === 'small';

    return (
        <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSmall]}>
            <Icon size={isSmall ? 10 : 12} color={config.text} />
            <Text style={[styles.text, { color: config.text }, isSmall && styles.textSmall]}>
                {config.label}
            </Text>
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    badgeSmall: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    text: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: 11,
        textTransform: 'uppercase',
    },
    textSmall: {
        fontSize: 9,
    },
});
