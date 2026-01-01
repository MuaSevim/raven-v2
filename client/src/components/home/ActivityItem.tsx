import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, Map } from 'lucide-react-native';
import StatusBadge from './StatusBadge';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface ActivityItemProps {
    item: {
        id: string;
        type: 'shipment' | 'offer' | 'transaction';
        status: string;
        origin: string;
        destination: string;
        price: number;
        currency: string;
    };
    onPress: () => void;
}

function getCurrencySymbol(currency: string): string {
    switch (currency) {
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'SEK': return 'kr';
        default: return '$';
    }
}

export default function ActivityItem({ item, onPress }: ActivityItemProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <StatusBadge status={item.status} size="small" />
                <Text style={styles.price}>
                    {getCurrencySymbol(item.currency)}{item.price}
                </Text>
            </View>
            <View style={styles.route}>
                <Text style={styles.city} numberOfLines={1}>{item.origin}</Text>
                <Map size={14} color={colors.textTertiary} />
                <ArrowRight size={14} color={colors.textTertiary} />
                <Text style={styles.city} numberOfLines={1}>{item.destination}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    price: {
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    route: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    city: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        flex: 1,
    },
});
