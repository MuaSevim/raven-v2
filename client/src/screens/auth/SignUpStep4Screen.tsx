import React, { useState, useMemo } from 'react';
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
import { Wand2, Check, X } from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { Input, Button, Header, ProgressIndicator } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { useSignupStore } from '../../store/useSignupStore';
import { authApi } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUpStep4'>;
};

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength calculation
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  // Cap at 4
  score = Math.min(score, 4);
  
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colorMap = [colors.error, '#FF6B00', colors.warning, '#7CB342', colors.success];
  
  return {
    score,
    label: labels[score],
    color: colorMap[score],
  };
};

// Password requirements check
interface PasswordRequirement {
  label: string;
  met: boolean;
}

const checkPasswordRequirements = (password: string): PasswordRequirement[] => {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'Number (0-9)', met: /\d/.test(password) },
    { label: 'Special character (!@#$...)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
};

// Generate random password
const generatePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export default function SignUpStep4Screen({ navigation }: Props) {
  const { data, updateData } = useSignupStore();
  
  const [email, setEmail] = useState(data.email);
  const [password, setPassword] = useState(data.password);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  const passwordRequirements = useMemo(
    () => checkPasswordRequirements(password),
    [password]
  );

  // Check if form is valid for enabling Next button
  const isFormValid = 
    isValidEmail(email.trim()) && 
    passwordStrength.score >= 2 && 
    password === confirmPassword &&
    confirmPassword.length > 0;

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength.score < 2) {
      newErrors.password = 'Please choose a stronger password';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Check if email already exists
      const { exists } = await authApi.checkEmail(email.trim().toLowerCase());
      if (exists) {
        setErrors({ email: 'This email is already registered' });
        setIsLoading(false);
        return;
      }

      // Register user with backend (creates Firebase Auth + DB user)
      await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDay: data.birthDay,
        birthMonth: data.birthMonth,
        birthYear: data.birthYear,
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
      });

      // Sign in the user on the client side with Firebase Auth
      // This ensures the client has a valid session after registration
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      // Send verification code
      await authApi.sendCode(email.trim().toLowerCase());

      // Update local store
      updateData({ email: email.trim().toLowerCase(), password });
      
      // Navigate to verification
      navigation.navigate('SignUpStep5');
    } catch (err: any) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    if (errors.password) setErrors({ ...errors, password: undefined });
    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
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
            <ProgressIndicator totalSteps={5} currentStep={4} />
          </View>

          <Text style={styles.title}>Create your account</Text>

          {/* Email Input */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password Input */}
          <Input
            label="Password"
            placeholder="Create a strong password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            isPassword
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          index < passwordStrength.score
                            ? passwordStrength.color
                            : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[styles.strengthLabel, { color: passwordStrength.color }]}
              >
                {passwordStrength.label}
              </Text>
            </View>
          )}

          {/* Password Requirements */}
          {password.length > 0 && (
            <View style={styles.requirementsContainer}>
              {passwordRequirements.map((req, index) => (
                <View key={index} style={styles.requirement}>
                  {req.met ? (
                    <Check size={14} color={colors.success} />
                  ) : (
                    <X size={14} color={colors.textTertiary} />
                  )}
                  <Text
                    style={[
                      styles.requirementText,
                      req.met && styles.requirementMet,
                    ]}
                  >
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Generate Password Button */}
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGeneratePassword}
          >
            <Wand2 size={18} color={colors.accent} />
            <Text style={styles.generateButtonText}>Generate strong password</Text>
          </TouchableOpacity>

          {/* Confirm Password Input */}
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors({ ...errors, confirmPassword: undefined });
            }}
            error={errors.confirmPassword}
            isPassword
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Next" onPress={handleNext} loading={isLoading} disabled={!isFormValid} />
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
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.sm,
    minWidth: 80,
    textAlign: 'right',
  },
  requirementsContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requirementText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  requirementMet: {
    color: colors.success,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  generateButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
