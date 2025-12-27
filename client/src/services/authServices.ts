// src/services/authServices.ts
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useState, useCallback } from "react";
import axios from "axios";

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

// Your backend server URL
const API_URL = "http://192.168.1.105:3000";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = "728915617614-cvqm9ttt8a6n8bb4q3j75nh4ia3nhi5a.apps.googleusercontent.com";
const REDIRECT_URI = "https://auth.expo.io/@mua.sevim/raven";

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const promptAsync = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build Google OAuth URL
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=token id_token&` +
        `scope=${encodeURIComponent("openid profile email")}&` +
        `nonce=${Math.random().toString(36).substring(2)}`;

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

      if (result.type === "success" && result.url) {
        // Parse the URL fragment to get tokens
        const urlFragment = result.url.split("#")[1];
        if (urlFragment) {
          const params = new URLSearchParams(urlFragment);
          const idToken = params.get("id_token");

          if (idToken) {
            // Sign in to Firebase with the Google ID token
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);

            console.log("Successfully logged into Firebase!");

            // Sync with backend
            try {
              const firebaseToken = await userCredential.user.getIdToken();
              await axios.post(
                `${API_URL}/auth/sync`,
                {},
                { headers: { Authorization: `Bearer ${firebaseToken}` } }
              );
              console.log("User synced with backend");
            } catch (error) {
              console.error("Backend sync error:", error);
            }

            return { success: true, user: userCredential.user };
          }
        }
      }

      return { success: false, error: "Authentication cancelled or failed" };
    } catch (error) {
      console.error("Google Auth Error:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { promptAsync, disabled: isLoading, isLoading };
};

// Sign out helper
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log("Signed out successfully");
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

// Helper function to get authenticated axios instance
export const getAuthenticatedApi = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const token = await user.getIdToken();
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};