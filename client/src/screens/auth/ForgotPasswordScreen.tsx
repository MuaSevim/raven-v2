import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { authApi } from "../../services/api";
import { Input, Button, Header } from "../../components/ui";
import { colors, typography, spacing } from "../../theme";
import { RootStackParamList } from "../../navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ForgotPassword">;
  route: { params?: { email?: string } };
};

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email || "");
  const [loading, setLoading] = useState(false);

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

      await sendPasswordResetEmail(auth, trimmed);
      Alert.alert("Success", "A password reset link has been sent to your email.", [
        { text: "OK", onPress: () => navigation.navigate("SignIn") },
      ]);
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
});
