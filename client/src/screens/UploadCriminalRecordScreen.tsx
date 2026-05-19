import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../utils/api';
import { uploadVerificationDocument } from '../services/storage';
import { invalidateCache } from '../utils/cache';

export default function UploadCriminalRecordScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/png', 'image/jpeg'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setFileUri(asset.uri);
    setFileName(asset.name || 'Document selected');
  };

  const handleContinue = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be signed in to upload documents.');
      return;
    }
    if (!fileUri) {
      Alert.alert('Missing file', 'Please select a criminal record file first.');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadVerificationDocument(user.uid, 'criminal-record', fileUri);
      await api.auth.updateProfile({ documentUrl: url });
      invalidateCache('auth:me');
      navigation.navigate('AccountStatus');
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not upload the document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.brand}>RAVEN</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Criminal Record Check</Text>
        <Text style={styles.subtitle}>
          Please upload a clear, legible copy of your recent criminal record check.
        </Text>

        <TouchableOpacity style={styles.uploadBox} onPress={handlePick} activeOpacity={0.8}>
          <View style={styles.uploadIcon}>
            <FileText size={28} color={colors.textPrimary} />
          </View>
          <Text style={styles.uploadTitle}>{fileName || 'Upload your criminal record'}</Text>
          <Text style={styles.uploadSubtitle}>Supports PDF, JPG, PNG (Max 10MB)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, (!fileUri || uploading) && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={!fileUri || uploading}
        >
          <Text style={styles.primaryButtonText}>{uploading ? 'Uploading...' : 'Continue'}</Text>
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
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.backgroundSecondary,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  uploadSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
});
