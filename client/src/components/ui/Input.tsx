import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, dimensions } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  containerStyle,
  rightIcon,
  isPassword,
  value,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.borderFocused
    : colors.border;

  const hasValue = value && value.length > 0;
  const eyeIconColor = hasValue ? colors.textSecondary : colors.textDisabled;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, { borderColor }]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={[styles.iconButton, !hasValue && styles.iconButtonDisabled]}
            onPress={() => hasValue && setShowPassword(!showPassword)}
            disabled={!hasValue}
          >
            {showPassword ? (
              <EyeOff size={20} color={eyeIconColor} />
            ) : (
              <Eye size={20} color={eyeIconColor} />
            )}
          </TouchableOpacity>
        )}
        {rightIcon && <View style={styles.iconButton}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: dimensions.inputHeight,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  iconButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
