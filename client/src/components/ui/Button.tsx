import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius, dimensions } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.backgroundSecondary,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  
  // Sizes
  size_sm: {
    height: 40,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    height: dimensions.buttonHeight,
    paddingHorizontal: spacing.xl,
  },
  
  // Disabled
  disabled: {
    opacity: 0.5,
  },
  
  // Text base
  text: {
    fontFamily: typography.fontFamily.semiBold,
  },
  
  // Text variants
  text_primary: {
    color: colors.textInverse,
  },
  text_secondary: {
    color: colors.textPrimary,
  },
  text_outline: {
    color: colors.textPrimary,
  },
  text_ghost: {
    color: colors.textPrimary,
  },
  
  // Text sizes
  textSize_sm: {
    fontSize: typography.fontSize.sm,
  },
  textSize_md: {
    fontSize: typography.fontSize.base,
  },
  textSize_lg: {
    fontSize: typography.fontSize.base,
  },
  
  textDisabled: {
    color: colors.textDisabled,
  },
});
