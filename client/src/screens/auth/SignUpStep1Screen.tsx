import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Button, Header, ProgressIndicator } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { useSignupStore } from '../../store/useSignupStore';
import { useGoogleAuth } from '../../services/authServices';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUpStep1'>;
};

export default function SignUpStep1Screen({ navigation }: Props) {
  const { data, updateData } = useSignupStore();
  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const { promptAsync: promptGoogleAuth, isLoading: isGoogleLoading } = useGoogleAuth();

  const handleGoogleSignUp = async () => {
    const result = await promptGoogleAuth();
    if (result.success) {
      // The auth listener in App.tsx or navigation setup will handle the redirect
    } else if (result.error && result.error !== 'Authentication cancelled or failed') {
      Alert.alert('Google Sign-Up Error', String(result.error));
    }
  };

  // Check if form is valid for enabling Next button
  const isFormValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const validateForm = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    
    updateData({ firstName: firstName.trim(), lastName: lastName.trim() });
    navigation.navigate('SignUpStep2');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Raven"
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressContainer}>
            <ProgressIndicator totalSteps={4} currentStep={1} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Let's get to know you.</Text>

            <Input
              label="First Name"
              placeholder="Liam"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) setErrors({ ...errors, firstName: undefined });
              }}
              error={errors.firstName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Input
              label="Last Name"
              placeholder="Carter"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) setErrors({ ...errors, lastName: undefined });
              }}
              error={errors.lastName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Button title="Next" onPress={handleNext} disabled={!isFormValid || isGoogleLoading} />
          
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignUp}
            disabled={isGoogleLoading}
          >
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  progressContainer: {
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  googleIconText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: '#4285F4',
  },
  googleButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
});
