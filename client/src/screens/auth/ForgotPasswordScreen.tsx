import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { sendPasswordResetEmail } from "firebase/auth";
import { Check } from "lucide-react-native";
import { auth } from "../../services/firebaseConfig";
import { actionCodeSettings } from "../../services/actionCodeSettings";
import { authApi } from "../../services/api";
import { Input, Button, Header } from "../../components/ui";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { RootStackParamList } from "../../navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;
  route: { params?: { email?: string } };
};

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email || "");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleSendReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Check if email exists in our system first
      try {
        const { exists } = await authApi.checkEmail(trimmed);
        if (!exists) {
          Alert.alert("Error", "Account doesn't exist");
          setLoading(false);
          return;
        }
      } catch (checkError) {
        console.error('Email check error:', checkError);
        // If check fails, we still try to proceed with Firebase
      }

      await sendPasswordResetEmail(auth, trimmed, actionCodeSettings);
      setLinkSent(true);
    } catch (error: Error | unknown) {
      let message = "Failed to send reset link";
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as any).code === 'auth/user-not-found') {
          message = "Account doesn't exist";
        } else {
          message = (error as any).message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLinkSent(false);
    await handleSendReset();
  };

  if (linkSent) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Raven" showBack onBack={() => navigation.goBack()} />

        <View style={styles.sentContent}>
          <View style={styles.checkCircle}>
            <Check size={32} color={colors.textInverse} strokeWidth={3} />
          </View>

          <Text style={styles.sentTitle}>Check your email</Text>
          <Text style={styles.sentSubtitle}>
            We've sent a password reset link to{"\n"}
            <Text style={styles.sentEmail}>{email.trim().toLowerCase()}</Text>
          </Text>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Text style={styles.doneButtonText}>Done ✓</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} disabled={loading}>
            <Text style={styles.resendText}>
              {loading ? "Sending..." : "Didn't receive it? Resend link"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Raven" showBack onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we will send a reset link.
          </Text>

          <Input
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="Send Reset Link"
            onPress={handleSendReset}
            loading={loading}
            style={styles.button}
          />
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
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize["2xl"],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.md,
  },
  // Sent state styles
  sentContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  sentTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize["2xl"],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sentSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  sentEmail: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  doneButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    marginBottom: spacing.lg,
  },
  doneButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  resendText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
