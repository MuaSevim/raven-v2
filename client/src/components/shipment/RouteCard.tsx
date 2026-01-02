import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface RouteCardProps {
    originCity: string;
    originCountry: string;
    destCity: string;
    destCountry: string;
    status: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RouteCard({
    originCity,
    originCountry,
    destCity,
    destCountry,
    status,
}: RouteCardProps) {
    // Route highlighting based on status
    const isOriginHighlighted = ['MATCHED', 'HANDED_OVER'].includes(status);
    const isLineHighlighted = status === 'ON_WAY';
    const isDestHighlighted = status === 'DELIVERED';

    return (
        <View style={styles.container}>
            <View style={styles.routeContainer}>
                {/* Origin */}
                <View style={styles.routePoint}>
                    <View style={[
                        styles.dot,
                        isOriginHighlighted && styles.dotHighlighted,
                        isLineHighlighted && styles.dotComplete,
                        isDestHighlighted && styles.dotComplete,
                    ]} />
                    <View style={styles.routeInfo}>
                        <Text style={styles.label}>From</Text>
                        <Text style={styles.city}>{originCity}</Text>
                        <Text style={styles.country}>{originCountry}</Text>
                    </View>
                </View>

                {/* Connector Line */}
                <View style={[
                    styles.line,
                    isLineHighlighted && styles.lineHighlighted,
                    isDestHighlighted && styles.lineComplete,
                ]} />

                {/* Destination */}
                <View style={styles.routePoint}>
                    <View style={[
                        styles.dot,
                        styles.dotDest,
                        isDestHighlighted && styles.dotHighlighted,
                    ]} />
                    <View style={styles.routeInfo}>
                        <Text style={styles.label}>To</Text>
                        <Text style={styles.city}>{destCity}</Text>
                        <Text style={styles.country}>{destCountry}</Text>
                    </View>
                </View>
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
    routeContainer: {
        position: 'relative',
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        zIndex: 1,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.border,
        marginTop: 4,
    },
    dotDest: {
        backgroundColor: colors.textTertiary,
    },
    dotHighlighted: {
        backgroundColor: '#22C55E',
    },
    dotComplete: {
        backgroundColor: colors.textPrimary,
    },
    routeInfo: {
        flex: 1,
        marginLeft: spacing.md,
        marginBottom: spacing.lg,
    },
    label: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textTertiary,
        textTransform: 'uppercase',
    },
    city: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginTop: 2,
    },
    country: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    line: {
        position: 'absolute',
        left: 7,
        top: 20,
        width: 2,
        height: 50,
        backgroundColor: colors.border,
        zIndex: 0,
    },
    lineHighlighted: {
        backgroundColor: '#22C55E',
    },
    lineComplete: {
        backgroundColor: colors.textPrimary,
    },
});
