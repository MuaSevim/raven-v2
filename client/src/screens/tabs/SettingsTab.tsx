import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  Info,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface SettingsItemProps {
  label: string;
  onPress: () => void;
  showBorder?: boolean;
  icon?: React.ReactNode;
}

function SettingsItem({ label, onPress, showBorder = true, icon }: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, !showBorder && styles.noBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        {icon}
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <ChevronRight size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

interface SettingsToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: React.ReactNode;
}

function SettingsToggle({ label, value, onValueChange, icon }: SettingsToggleProps) {
  return (
    <View style={[styles.settingsItem, styles.noBorder]}>
      <View style={styles.itemLeft}>
        {icon}
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.textPrimary }}
        thumbColor={colors.background}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SettingsTab() {
  const navigation = useNavigation<any>();


  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Payment */}
        <View style={styles.group}>
          <SettingsItem
            label="Payment Methods"
            icon={<CreditCard size={20} color={colors.textPrimary} />}
            onPress={() => navigation.navigate('PaymentMethods')}
            showBorder={false}
          />
        </View>

        {/* Preferences */}
        <View style={styles.group}>
          <SettingsToggle
            label="Push Notifications"
            icon={<Bell size={20} color={colors.textPrimary} />}
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* Appearance */}
        {/* <View style={styles.group}>
          <SettingsToggle
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View> */}

        {/* Info & Legal */}
        <View style={styles.group}>
          <SettingsItem
            label="Help & Support"
            icon={<HelpCircle size={20} color={colors.textPrimary} />}
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <SettingsItem
            label="Privacy Policy"
            icon={<Shield size={20} color={colors.textPrimary} />}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingsItem
            label="About Raven"
            icon={<Info size={20} color={colors.textPrimary} />}
            onPress={() => navigation.navigate('About')}
            showBorder={false}
          />
        </View>



        {/* Version */}
        <Text style={styles.version}>Version 2.5.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 3,
  },

  // Group
  group: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },

  // Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },

  // Sign Out
  signOutButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signOutText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.error,
  },

  // Version
  version: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
