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
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { Input, Button, Header } from "../../components/ui";
import { colors, typography, spacing } from "../../theme";
import { RootStackParamList } from "../../navigation";
import { useAuthStore } from "../../store/useAuthStore";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "EnterNewPassword">;
  route: { params: { oobCode: string } };
};

export default function EnterNewPasswordScreen({ navigation, route }: Props) {
  const { user } = useAuthStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, route.params.oobCode, newPassword);
      Alert.alert("Success", "Password updated successfully", [
        {
          text: "OK",
          onPress: () => {
            if (user) {
              navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: "SignIn" }] });
            }
          },
        },
      ]);
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
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
          <Text style={styles.title}>Set a new password</Text>

          <Input
            label="New Password"
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />

          <Button
            title="Update Password"
            onPress={handleSubmit}
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
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
});
