import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, dimensions } from '../../theme';

interface ProgressIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export default function ProgressIndicator({
  totalSteps,
  currentStep,
}: ProgressIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index + 1 <= currentStep ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: dimensions.progressDotSize,
    height: dimensions.progressDotSize,
    borderRadius: dimensions.progressDotSize / 2,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: colors.border,
  },
});
