import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import StatusBadge from './StatusBadge';

// =============================================================================
// TYPES
// =============================================================================

interface ActivityItemProps {
    origin: string;
    destination: string;
    status: string;
    price: string;
    ownerName: string;
    onPress: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ActivityItem({
    origin,
    destination,
    status,
    price,
    ownerName,
    onPress,
}: ActivityItemProps) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            {/* Status Badge Row */}
            <View style={styles.statusRow}>
                <StatusBadge status={status} size="small" />
            </View>

            {/* Route Row */}
            <View style={styles.routeRow}>
                <View style={styles.route}>
                    <MapPin size={14} color={colors.textSecondary} strokeWidth={1.5} />
                    <Text style={styles.city}>{origin}</Text>
                    <Text style={styles.arrow}>→</Text>
                    <MapPin size={14} color={colors.textSecondary} strokeWidth={1.5} />
                    <Text style={styles.city}>{destination}</Text>
                </View>
            </View>

            {/* Details Row */}
            <View style={styles.detailsRow}>
                <Text style={styles.ownerName}>{ownerName}</Text>
                <View style={styles.rightInfo}>
                    <Text style={styles.price}>{price}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    statusRow: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    route: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    city: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    arrow: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
        marginHorizontal: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    ownerName: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        flex: 1,
    },
    rightInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    price: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.sm,
        color: colors.textPrimary,
    },
});
