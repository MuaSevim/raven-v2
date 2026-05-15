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
import { authApi } from '../../services/api';
import { Input, Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { useSignupStore } from '../../store/useSignupStore';

type SignInScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'>;
};

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const resetSignup = useSignupStore((state) => state.reset);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);

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

      // Check if email exists in our system first with a short 3-second timeout
      // to prevent hanging if the backend network is unreachable.
      try {
        const checkPromise = authApi.checkEmail(emailLower);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        );
        const { exists } = await Promise.race([checkPromise, timeoutPromise]) as { exists: boolean };
        
        if (!exists) {
          setErrors({ email: "Account doesn't exist" });
          setIsLoading(false);
          return;
        }
      } catch (checkError) {
        console.error('Email check error:', checkError);
        // If check fails or times out, we still try to proceed with Firebase
      }

      // Sign in directly with Firebase
      const credential = await signInWithEmailAndPassword(auth, emailLower, password);
      setFailedLoginAttempts(0);

      if (!credential.user.emailVerified) {
        // App.tsx auth listener handles routing automatically, 
        // but just in case, we can clear the form
        setEmail('');
        setPassword('');
      }

    } catch (error: any) {
      // Handle errors
      let emailError: string | undefined;
      let passwordError: string | undefined;

      switch (error.code) {
        case 'auth/user-not-found':
          // No account with this email
          emailError = "Account doesn't exist";
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          // Password is incorrect or user not found
          passwordError = 'Incorrect credentials. Please try again.';
          setFailedLoginAttempts((prev) => prev + 1);
          setPassword(''); // Clear password field
          break;
        case 'auth/user-disabled':
          emailError = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          passwordError = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          emailError = 'Network error. Please check your connection.';
          break;
        case 'auth/invalid-email':
          emailError = 'Invalid email address';
          break;
        default:
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
            <Text style={styles.tagline}>"Travel around the planet"</Text>
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

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword', { email })}
            >
              <Text
                style={[
                  styles.forgotPasswordText,
                  failedLoginAttempts >= 3 && styles.forgotPasswordEmphasis,
                ]}
              >
                Forgot my password
              </Text>
            </TouchableOpacity>

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
            <TouchableOpacity
              onPress={() => {
                resetSignup();
                setEmail('');
                setPassword('');
                setErrors({});
                navigation.navigate('SignUpStep1');
              }}
            >
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
    fontSize: typography.fontSize.xs,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotPasswordText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  forgotPasswordEmphasis: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
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
