import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, Circle, Plane, HandHeart, Package } from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface DeliveryProgressProps {
    status: string;
    handedOverAt?: string;
    departedAt?: string;
    deliveredAt?: string;
}

interface ProgressStep {
    id: string;
    label: string;
    icon: any;
    isComplete: boolean;
    isActive: boolean;
    timestamp?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const getSteps = (status: string, timestamps: Record<string, string | undefined>): ProgressStep[] => {
    const statusOrder = ['MATCHED', 'HANDED_OVER', 'ON_WAY', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(status);

    return [
        {
            id: 'matched',
            label: 'Matched',
            icon: CheckCircle,
            isComplete: currentIndex >= 0,
            isActive: currentIndex === 0,
        },
        {
            id: 'handed_over',
            label: 'Handed Over',
            icon: HandHeart,
            isComplete: currentIndex >= 1,
            isActive: currentIndex === 1,
            timestamp: timestamps.handedOverAt,
        },
        {
            id: 'in_transit',
            label: 'On Way',
            icon: Plane,
            isComplete: currentIndex >= 2,
            isActive: currentIndex === 2,
            timestamp: timestamps.departedAt,
        },
        {
            id: 'delivered',
            label: 'Delivered',
            icon: Package,
            isComplete: currentIndex >= 3,
            isActive: currentIndex === 3,
            timestamp: timestamps.deliveredAt,
        },
    ];
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function DeliveryProgress({
    status,
    handedOverAt,
    departedAt,
    deliveredAt,
}: DeliveryProgressProps) {
    const steps = getSteps(status, { handedOverAt, departedAt, deliveredAt });

    return (
        <View style={styles.container}>
            {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isLast = index === steps.length - 1;

                return (
                    <View key={step.id} style={styles.stepContainer}>
                        {/* Icon */}
                        <View style={[
                            styles.iconContainer,
                            step.isComplete && styles.iconComplete,
                            step.isActive && styles.iconActive,
                        ]}>
                            {step.isComplete ? (
                                <CheckCircle size={20} color={colors.background} />
                            ) : (
                                <StepIcon size={20} color={step.isActive ? colors.textPrimary : colors.textTertiary} />
                            )}
                        </View>

                        {/* Content */}
                        <View style={styles.stepContent}>
                            <Text style={[
                                styles.stepLabel,
                                step.isComplete && styles.stepLabelComplete,
                                step.isActive && styles.stepLabelActive,
                            ]}>
                                {step.label}
                            </Text>
                            {step.timestamp && (
                                <Text style={styles.stepTimestamp}>{formatDate(step.timestamp)}</Text>
                            )}
                        </View>

                        {/* Connector Line */}
                        {!isLast && (
                            <View style={[
                                styles.connector,
                                step.isComplete && styles.connectorComplete,
                            ]} />
                        )}
                    </View>
                );
            })}
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing.sm,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 60,
        position: 'relative',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.border,
    },
    iconComplete: {
        backgroundColor: colors.textPrimary,
        borderColor: colors.textPrimary,
    },
    iconActive: {
        borderColor: colors.textPrimary,
    },
    stepContent: {
        flex: 1,
        marginLeft: spacing.md,
        paddingTop: spacing.xs,
    },
    stepLabel: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: colors.textTertiary,
    },
    stepLabelComplete: {
        color: colors.textPrimary,
    },
    stepLabelActive: {
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
    },
    stepTimestamp: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    connector: {
        position: 'absolute',
        left: 17,
        top: 38,
        width: 2,
        height: 22,
        backgroundColor: colors.border,
    },
    connectorComplete: {
        backgroundColor: colors.textPrimary,
    },
});
