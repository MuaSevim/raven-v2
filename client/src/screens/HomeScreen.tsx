import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, MapPin, Package, User } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

export default function HomeScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <User size={24} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Banner */}
      <View style={styles.successBanner}>
        <Text style={styles.successTitle}>🎉 Account Created!</Text>
        <Text style={styles.successText}>
          You're all set to start using Raven. Explore the app and discover how
          you can travel for free.
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Package size={24} color="#4CAF50" />
            </View>
            <Text style={styles.actionTitle}>Send Package</Text>
            <Text style={styles.actionSubtitle}>Ship items easily</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <MapPin size={24} color="#2196F3" />
            </View>
            <Text style={styles.actionTitle}>Be a Traveler</Text>
            <Text style={styles.actionSubtitle}>Earn while traveling</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How Raven Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect</Text>
              <Text style={styles.stepDescription}>
                Senders connect with travelers going their way
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ship</Text>
              <Text style={styles.stepDescription}>
                Travelers carry packages in their extra luggage space
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Save</Text>
              <Text style={styles.stepDescription}>
                Everyone saves money and reduces carbon footprint
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  welcomeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  userName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  profileButton: {
    width: 48,
    height: 48,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
  },
  successTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.success,
    marginBottom: spacing.xs,
  },
  successText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  stepsContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  signOutText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.error,
  },
});
