// src/services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
// @ts-ignore: getReactNativePersistence is missing from web-based types but present in RN bundle
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAM3oUAhZCawe2kBPsa_-Z6oacZ-vUBfWA",
  authDomain: "raven-app-e21c2.firebaseapp.com",
  projectId: "raven-app-e21c2",
  storageBucket: "raven-app-e21c2.firebasestorage.app",
  messagingSenderId: "728915617614",
  appId: "1:728915617614:web:3f3e76bec3e939ecbbe01f",
  measurementId: "G-CZKHHNQRJ4",
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for Raven
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const storage = getStorage(app);
const firestore = getFirestore(app);

export { auth, storage, firestore };
