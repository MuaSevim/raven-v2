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

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      // Navigation will automatically switch to Home screen via onAuthStateChanged
    } catch (error: any) {
      // Handle Firebase errors with user-friendly messages
      let errorMessage = 'Sign in failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password sign-in is not enabled. Please contact support.';
          console.error('FIREBASE ERROR: Email/Password provider is not enabled in Firebase Console!');
          console.error('Enable it at: https://console.firebase.google.com/project/raven-app-e21c2/authentication/providers');
          break;
        default:
          // Log unexpected errors for debugging
          console.error('Sign in error:', error.code, error.message);
          errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      setErrors({ email: errorMessage });
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
                source={require('../../../assets/images/raven-logo-black.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>RAVEN</Text>
            <Text style={styles.tagline}>"Travel for free"</Text>
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
