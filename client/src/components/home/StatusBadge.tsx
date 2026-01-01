import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle, Truck, Package, XCircle, Plane } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface StatusBadgeProps {
    status: string;
    size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; Icon: any }> = {
    OPEN: { bg: '#FFF3E0', text: '#FF9800', label: 'OPEN', Icon: Clock },
    MATCHED: { bg: '#E3F2FD', text: '#1976D2', label: 'MATCHED', Icon: CheckCircle },
    IN_TRANSIT: { bg: '#E8F5E9', text: '#4CAF50', label: 'ONGOING', Icon: Plane },
    DELIVERED: { bg: '#F5F5F5', text: '#9E9E9E', label: 'DELIVERED', Icon: Package },
    CANCELLED: { bg: '#FFEBEE', text: '#F44336', label: 'CANCELLED', Icon: XCircle },
    PENDING: { bg: '#FFF8E1', text: '#FFA000', label: 'PENDING', Icon: Clock },
};

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
    const { Icon } = config;
    const isSmall = size === 'small';

    return (
        <View style={[
            styles.badge,
            { backgroundColor: config.bg },
            isSmall && styles.badgeSmall
        ]}>
            <Icon size={isSmall ? 10 : 12} color={config.text} />
            <Text style={[
                styles.text,
                { color: config.text },
                isSmall && styles.textSmall
            ]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    badgeSmall: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
    },
    text: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.xs,
        textTransform: 'uppercase',
    },
    textSmall: {
        fontSize: 10,
    },
});
