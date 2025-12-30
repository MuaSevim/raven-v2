import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, dimensions } from '../../theme';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function Header({
  title,
  showBack = false,
  onBack,
  rightElement,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.centerSection}>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
      
      <View style={styles.rightSection}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: dimensions.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
});
