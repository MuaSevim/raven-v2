import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Header, ProgressIndicator } from '../../components/ui';
import { colors, typography, spacing, borderRadius, dimensions } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { useSignupStore } from '../../store/useSignupStore';
import { authApi } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUpStep5'>;
};

const CODE_LENGTH = 4;

export default function SignUpStep5Screen({ navigation }: Props) {
  const { data, reset: resetSignup } = useSignupStore();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];

    // Handle paste (multiple characters)
    if (value.length > 1) {
      const chars = value.split('').slice(0, CODE_LENGTH);
      chars.forEach((char, i) => {
        if (i + index < CODE_LENGTH) {
          newCode[i + index] = char;
        }
      });
      setCode(newCode);
      // Focus on next empty input or last input
      const nextIndex = Math.min(index + chars.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      // Dismiss keyboard if all filled
      if (newCode.every(c => c !== '')) {
        Keyboard.dismiss();
      }
    } else {
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input or dismiss keyboard if complete
      if (value && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (value && index === CODE_LENGTH - 1) {
        // Last digit entered, dismiss keyboard
        Keyboard.dismiss();
      }
    }

    // Clear error when user types
    if (error) setError(null);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const enteredCode = code.join('');

    if (enteredCode.length !== CODE_LENGTH) {
      setError('Please enter the complete code');
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      // Call backend to verify code
      await authApi.verify(data.email, enteredCode);

      // Sign in the user with Firebase Auth after successful verification
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../services/firebaseConfig');
      await signInWithEmailAndPassword(auth, data.email, data.password);

      // Success! Clear signup store
      // Note: Don't navigate here - onAuthStateChanged will automatically
      // switch us to the authenticated stack when Firebase auth succeeds
      resetSignup();
      // The navigation is handled automatically by the auth state listener
    } catch (err: any) {
      const message = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(message);
      // Clear the code
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setResendCooldown(60);

    try {
      await authApi.sendCode(data.email);
      Alert.alert(
        'Code Sent',
        `A new verification code has been sent to ${data.email}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to send code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <Header
            title="Raven"
            showBack
            onBack={() => navigation.goBack()}
          />

          <View style={styles.content}>
            <View style={styles.progressContainer}>
              <ProgressIndicator totalSteps={5} currentStep={5} />
            </View>

            <View style={styles.centerContent}>
              <Text style={styles.title}>Verification</Text>
              <Text style={styles.heading}>We sent you a code</Text>
              <Text style={styles.subtitle}>
                Please enter the 4-digit code sent to{'\n'}
                <Text style={styles.email}>{data.email}</Text>
              </Text>

              {/* Code Input Boxes */}
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled,
                      error && styles.codeInputError,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={CODE_LENGTH - index}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Resend Code */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={resendCooldown > 0}
              >
                <Text
                  style={[
                    styles.resendText,
                    resendCooldown > 0 && styles.resendTextDisabled,
                  ]}
                >
                  {resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : 'Resend Code'}
                </Text>
              </TouchableOpacity>

              {/* Demo hint */}
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  💡 For testing, use code: <Text style={styles.hintCode}>0000</Text>
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="Verify"
              onPress={handleVerify}
              loading={isLoading}
              disabled={code.join('').length !== CODE_LENGTH}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  progressContainer: {
    paddingVertical: spacing.md,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['2xl'],
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  email: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  codeInput: {
    width: 56,
    height: 56,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  codeInputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resendButton: {
    paddingVertical: spacing.sm,
  },
  resendText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  resendTextDisabled: {
    color: colors.textDisabled,
  },
  hintContainer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
  },
  hintText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
  },
  hintCode: {
    fontFamily: typography.fontFamily.bold,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
