import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock, CheckCircle } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface PaymentProgressProps {
    status: string; // MATCHED, HANDED_OVER, ON_WAY, DELIVERED
    amount: number;
    currency: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
        EUR: '€',
        GBP: '£',
        SEK: 'kr',
        USD: '$',
    };
    return symbols[currency] || '$';
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function PaymentProgress({ status, amount, currency }: PaymentProgressProps) {
    const isDelivered = status === 'DELIVERED';
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Payment Status</Text>

            <View style={styles.stepsContainer}>
                {/* Payment Held */}
                <View style={styles.step}>
                    <View style={[styles.dot, !isDelivered && styles.dotActive]}>
                        {!isDelivered ? (
                            <Lock size={12} color={colors.background} />
                        ) : (
                            <CheckCircle size={12} color={colors.background} />
                        )}
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepLabel, !isDelivered && styles.stepLabelActive]}>
                            Payment Held
                        </Text>
                        <Text style={styles.stepDescription}>
                            {currencySymbol}{amount} secured in escrow
                        </Text>
                    </View>
                </View>

                {/* Connector */}
                <View style={[styles.connector, isDelivered && styles.connectorComplete]} />

                {/* Payment Released */}
                <View style={styles.step}>
                    <View style={[styles.dot, isDelivered && styles.dotActive]}>
                        {isDelivered ? (
                            <CheckCircle size={12} color={colors.background} />
                        ) : (
                            <View style={styles.dotInner} />
                        )}
                    </View>
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepLabel, isDelivered && styles.stepLabelActive]}>
                            Payment Released
                        </Text>
                        <Text style={styles.stepDescription}>
                            {isDelivered ? 'Funds transferred to Raven' : 'Upon delivery confirmation'}
                        </Text>
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
    title: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    stepsContainer: {
        paddingLeft: spacing.sm,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotActive: {
        backgroundColor: colors.textPrimary,
    },
    dotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textTertiary,
    },
    stepContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    stepLabel: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: colors.textTertiary,
    },
    stepLabelActive: {
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
    },
    stepDescription: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
        marginTop: 2,
    },
    connector: {
        width: 2,
        height: 20,
        backgroundColor: colors.border,
        marginLeft: 11,
        marginVertical: spacing.xs,
    },
    connectorComplete: {
        backgroundColor: colors.textPrimary,
    },
});
