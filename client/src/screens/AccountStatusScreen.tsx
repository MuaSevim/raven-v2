import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, FileText, ShieldCheck, User, CheckCircle, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { api } from '../utils/api';
import { invalidateCache } from '../utils/cache';

interface VerificationStatusState {
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended';
  passport?: string | null;
  documentUrl?: string | null;
  avatar?: string | null;
}

const isComplete = (state: VerificationStatusState) =>
  Boolean(state.avatar) && Boolean(state.passport) && Boolean(state.documentUrl);

export default function AccountStatusScreen() {
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<VerificationStatusState>({});
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.auth.me();
      setStatus({
        verificationStatus: data?.verificationStatus,
        passport: data?.passport || null,
        documentUrl: (data as any)?.documentUrl || null,
        avatar: data?.avatar || null,
      });
    } catch (err) {
      console.error('Failed to load account status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      invalidateCache('auth:me');
      fetchStatus();
    }, [fetchStatus])
  );

  const verified = status.verificationStatus === 'verified' || isComplete(status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.brand}>RAVEN</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account Status</Text>
        <Text style={styles.subtitle}>
          Complete your verification to unlock all features.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <ShieldCheck size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.cardTitle}>Passport</Text>
            <View style={[styles.statusPill, status.passport ? styles.statusOk : styles.statusPending]}>
              <Text style={styles.statusText}>{status.passport ? 'Uploaded' : 'Not Uploaded'}</Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Required for identity verification and international deliveries.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('UploadPassport')}
          >
            <Text style={styles.primaryButtonText}>Upload Document</Text>
            <ChevronRight size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <FileText size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.cardTitle}>Criminal Record</Text>
            <View style={[styles.statusPill, status.documentUrl ? styles.statusOk : styles.statusPending]}>
              <Text style={styles.statusText}>{status.documentUrl ? 'Uploaded' : 'Unverified'}</Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Ensure trust and safety within the Raven network.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('UploadCriminalRecord')}
          >
            <Text style={styles.primaryButtonText}>Verify Status</Text>
            <ChevronRight size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <User size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.cardTitle}>Profile Picture</Text>
            <View style={[styles.statusPill, status.avatar ? styles.statusOk : styles.statusPending]}>
              <Text style={styles.statusText}>{status.avatar ? 'Verified' : 'Missing'}</Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Your clear face photo is visible to travelers and senders.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.secondaryButtonText}>Update Picture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, verified ? styles.badgeVerified : styles.badgePending]}>
            <CheckCircle size={16} color={verified ? '#22C55E' : colors.textSecondary} />
            <Text style={styles.badgeText}>{verified ? 'Verified' : 'Unverified'}</Text>
          </View>
          {loading && <Text style={styles.loadingText}>Refreshing status...</Text>}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  brand: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusOk: {
    backgroundColor: '#E7F8EF',
  },
  statusPending: {
    backgroundColor: colors.background,
  },
  statusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  cardDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  badgeVerified: {
    backgroundColor: '#F0FDF4',
  },
  badgePending: {
    backgroundColor: colors.backgroundSecondary,
  },
  badgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
});
