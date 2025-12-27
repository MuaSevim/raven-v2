import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useGoogleAuth } from "../services/authServices";

export default function LoginScreen() {
  const { promptAsync, disabled, isLoading } = useGoogleAuth();

  const handleGoogleSignIn = async () => {
    const result = await promptAsync();
    if (!result.success) {
      console.log("Sign in failed or cancelled");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Raven</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.googleButton, (disabled || isLoading) && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
