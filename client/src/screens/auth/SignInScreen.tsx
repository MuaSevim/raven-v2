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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { Input, Button } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../navigation';

type SignInScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'>;
};

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check if form is valid for button state
  const isFormValid = email.trim().length > 0 && password.length >= 6;


  const handleSignIn = async () => {
    // Clear any previous errors
    setErrors({});

    // Step 1: Check if both fields are filled
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    // Step 2: Validate email format
    if (!isValidEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    // Step 3: Check password length
    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setIsLoading(true);

    try {
      const emailLower = email.trim().toLowerCase();

      // Sign in directly with Firebase - it will tell us if user doesn't exist
      await signInWithEmailAndPassword(auth, emailLower, password);
      // Navigation will automatically switch to Home screen via onAuthStateChanged

    } catch (error: any) {
      // Handle errors
      let emailError: string | undefined;
      let passwordError: string | undefined;

      switch (error.code) {
        case 'auth/user-not-found':
          // No account with this email
          emailError = 'No account found with this email';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          // Password is incorrect or user not found (Firebase combines these for security)
          passwordError = 'Invalid email or password';
          setPassword(''); // Clear password field
          break;
        case 'auth/user-disabled':
          // Account has been disabled
          emailError = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          // Too many failed login attempts
          passwordError = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          // Network error
          emailError = 'Network error. Please check your connection.';
          break;
        case 'auth/invalid-email':
          emailError = 'Invalid email address';
          break;
        default:
          // Log unexpected errors for debugging
          console.error('Sign in error:', error.code, error.message);
          emailError = error.message || 'An unexpected error occurred. Please try again.';
      }

      setErrors({
        email: emailError,
        password: passwordError,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>RAVEN</Text>
            <Text style={styles.tagline}>"Flying has never been cheaper"</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.title}>Sign In</Text>

            <Input
              label="Email"
              placeholder="Email"
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

            <Input
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              isPassword
            />

            <Button
              title="Continue"
              onPress={handleSignIn}
              loading={isLoading}
              disabled={!isFormValid}
              style={styles.signInButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account yet? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUpStep1')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  logoSection: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.sm,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  brandName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formSection: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  signInButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
});
