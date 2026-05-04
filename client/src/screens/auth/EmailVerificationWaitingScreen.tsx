import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { colors, typography, spacing } from "../../theme";
import { Button } from "../../components/ui";
import { useAuthStore } from "../../store/useAuthStore";
import { RootStackParamList } from "../../navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "EmailVerificationWaiting">;
  route: { params?: { email?: string } };
};

export default function EmailVerificationWaitingScreen({ navigation, route }: Props) {
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const email = route.params?.email || auth.currentUser?.email || "";

  const handleVerify = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No active session found. Please sign in again.");
      navigation.navigate("SignIn");
      return;
    }

    setLoading(true);
    try {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        setUser(currentUser);
        // The reactive navigator in App.tsx will automatically switch to MainTabs 
        // since isAuthenticated will now evaluate to true.
      } else {
        Alert.alert("Not Verified", "Email not verified yet. Please check your inbox.");
      }
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "Unable to verify email";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No active session found. Please sign in again.");
      navigation.navigate("SignIn");
      return;
    }

    try {
      await sendEmailVerification(currentUser);
      Alert.alert("Sent", "A new verification link has been sent.");
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "Failed to resend email";
      Alert.alert("Error", message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to{"\n"}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <Button
          title="I've Verified My Email"
          onPress={handleVerify}
          loading={loading}
          style={styles.primaryButton}
        />

        <Text style={styles.resend} onPress={handleResend}>
          Resend Email
        </Text>
      </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize["2xl"],
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  email: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.medium,
  },
  primaryButton: {
    alignSelf: "stretch",
  },
  resend: {
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
