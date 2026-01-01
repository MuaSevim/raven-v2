import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    style?: any;
    borderRadius?: number;
}

export default function SkeletonLoader({
    width = '100%',
    height = 16,
    style,
    borderRadius: customRadius = borderRadius.md
}: SkeletonLoaderProps) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    opacity,
                    borderRadius: customRadius,
                },
                style,
            ]}
        />
    );
}

// Pre-built skeleton components for common use cases
export function ActivitySkeleton() {
    return (
        <View style={styles.activitySkeleton}>
            <View style={styles.activityHeader}>
                <SkeletonLoader width={80} height={24} borderRadius={12} />
                <SkeletonLoader width={60} height={20} />
            </View>
            <View style={styles.activityRoute}>
                <SkeletonLoader width={100} height={16} />
                <SkeletonLoader width={100} height={16} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: colors.border,
    },
    activitySkeleton: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    activityRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
});
