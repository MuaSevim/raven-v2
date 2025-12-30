import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme';

interface StepHeaderProps {
  title: string;
  currentStep: number;
  totalSteps: number;
  onClose: () => void;
}

export function StepHeader({ title, currentStep, totalSteps, onClose }: StepHeaderProps) {
  const progress = currentStep / totalSteps;
  
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.stepInfo}>
        <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

interface BottomButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function BottomButton({ label, onPress, disabled }: BottomButtonProps) {
  return (
    <View style={styles.bottomContainer}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  stepInfo: {
    marginBottom: spacing.sm,
  },
  stepText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
  },
  // Bottom Button
  bottomContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.textPrimary,
    borderRadius: 100,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  buttonTextDisabled: {
    color: colors.textDisabled,
  },
});
