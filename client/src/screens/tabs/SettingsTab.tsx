import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, MessageSquare, CreditCard, Inbox } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';

interface SettingsItemProps {
  label: string;
  onPress: () => void;
  showBorder?: boolean;
  icon?: React.ReactNode;
  badge?: number;
}

function SettingsItem({ label, onPress, showBorder = true, icon, badge }: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, !showBorder && styles.settingsItemNoBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        {icon}
        <Text style={styles.settingsItemLabel}>{label}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        <ChevronRight size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

interface SettingsToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingsToggle({ label, value, onValueChange }: SettingsToggleProps) {
  return (
    <View style={[styles.settingsItem, styles.settingsItemNoBorder]}>
      <Text style={styles.settingsItemLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.textTertiary }}
        thumbColor={colors.background}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

export default function SettingsTab() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count
  useFocusEffect(
    useCallback(() => {
      const fetchUnreadCount = async () => {
        if (!user) return;
        try {
          const token = await user.getIdToken();
          const response = await fetch(`${API_URL}/conversations/unread`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.count || 0);
          }
        } catch (err) {
          console.error('Error fetching unread count:', err);
        }
      };
      fetchUnreadCount();
    }, [user])
  );

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (err) {
              console.error('Sign out error:', err);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Settings Groups */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Messages & Communication */}
        <View style={styles.settingsGroup}>
          <SettingsItem
            label="Inbox"
            icon={<Inbox size={20} color={colors.textPrimary} />}
            badge={unreadCount}
            onPress={() => navigation.navigate('Inbox')}
            showBorder={false}
          />
        </View>

        {/* Profile & Payment */}
        <View style={styles.settingsGroup}>
          <SettingsItem
            label="Profile Information"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingsItem
            label="Payment Methods"
            icon={<CreditCard size={20} color={colors.textPrimary} />}
            onPress={() => navigation.navigate('PaymentMethods')}
            showBorder={false}
          />
        </View>

        {/* Notifications & Privacy */}
        <View style={styles.settingsGroup}>
          <SettingsItem
            label="Notifications"
            onPress={() => { }}
          />
          <SettingsItem
            label="Privacy"
            onPress={() => { }}
            showBorder={false}
          />
        </View>

        {/* Dark Mode */}
        <View style={styles.settingsGroup}>
          <SettingsToggle
            label="Dark Mode"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        {/* Help & About */}
        <View style={styles.settingsGroup}>
          <SettingsItem
            label="Help & Support"
            onPress={() => { }}
          />
          <SettingsItem
            label="About Raven"
            onPress={() => { }}
            showBorder={false}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Version 2.4.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 3,
  },
  // Settings Groups
  settingsGroup: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsItemNoBorder: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsItemLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 11,
    color: colors.textInverse,
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
  versionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
