import React, { useEffect, useCallback } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useAuthStore } from "./store/useAuthStore";
import { colors, spacing } from "./theme";

// Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PublicProfileScreen from "./screens/PublicProfileScreen";
import ActivitiesScreen from "./screens/ActivitiesScreen";
import NetworkDiagnosticsScreen from "./screens/NetworkDiagnosticsScreen";
import {
  SignInScreen,
  SignUpStep1Screen,
  SignUpStep2Screen,
  SignUpStep3Screen,
  SignUpStep4Screen,
  SignUpStep5Screen,
} from "./screens/auth";

// Shipment Screens
import {
  SetRouteScreen,
  PackageDetailsScreen,
  DeliveryWindowScreen,
  SetPriceScreen,
  ContactDetailsScreen,
  ReviewShipmentScreen,
  FinalizeDetailsScreen,
  DeliveryPostedScreen,
  ShipmentDetailScreen,
} from "./screens/shipment";

// Chat Screen
import { ChatScreen } from "./screens/chat";

// Inbox Screen
import { InboxScreen } from "./screens/inbox";

// Payment Screens
import { AddCardScreen, PaymentMethodsScreen } from "./screens/payments";

// Delivery Screens
import { DeliveryTrackingScreen } from "./screens/delivery";

// Tab Navigator
import MainTabNavigator from "./navigation/MainTabNavigator";

export type RootStackParamList = {
  SignIn: undefined;
  SignUpStep1: undefined;
  SignUpStep2: undefined;
  SignUpStep3: undefined;
  SignUpStep4: undefined;
  SignUpStep5: undefined;
  Welcome: undefined;
  MainTabs: undefined;
  // Shipment Flow (6 steps)
  SetRoute: undefined;
  PackageDetails: undefined;
  DeliveryWindow: undefined;
  SetPrice: undefined;
  ContactDetails: undefined;
  ReviewShipment: undefined;
  FinalizeDetails: undefined;
  DeliveryPosted: { shipment?: any };
  ShipmentDetail: { shipmentId: string };
  Chat: {
    conversationId?: string;
    shipmentId: string;
    recipientId: string;
    recipientName?: string;
  };
  Inbox: undefined;
  AddCard: undefined;
  PaymentMethods: undefined;
  DeliveryTracking: { transactionId: string };
  Profile: undefined;
  PublicProfile: { userId: string };
  Activities: undefined;
  NetworkDiagnostics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function Navigation() {
  const { user, loading, setLoading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Set loading to false once fonts are ready
    if (fontsLoaded) {
      setLoading(false);
    }
  }, [fontsLoaded, setLoading]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && !loading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Authenticated Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            {/* Shipment Flow - 6 Steps */}
            <Stack.Screen name="SetRoute" component={SetRouteScreen} />
            <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
            <Stack.Screen name="DeliveryWindow" component={DeliveryWindowScreen} />
            <Stack.Screen name="SetPrice" component={SetPriceScreen} />
            <Stack.Screen name="ContactDetails" component={ContactDetailsScreen} />
            <Stack.Screen name="ReviewShipment" component={ReviewShipmentScreen} />
            <Stack.Screen name="FinalizeDetails" component={FinalizeDetailsScreen} />
            <Stack.Screen name="DeliveryPosted" component={DeliveryPostedScreen} />
            <Stack.Screen name="ShipmentDetail" component={ShipmentDetailScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Inbox" component={InboxScreen} />
            <Stack.Screen name="AddCard" component={AddCardScreen} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
            <Stack.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
            <Stack.Screen name="Activities" component={ActivitiesScreen} />
            <Stack.Screen name="NetworkDiagnostics" component={NetworkDiagnosticsScreen} />
          </>
        ) : (
          // Auth Stack
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUpStep1" component={SignUpStep1Screen} />
            <Stack.Screen name="SignUpStep2" component={SignUpStep2Screen} />
            <Stack.Screen name="SignUpStep3" component={SignUpStep3Screen} />
            <Stack.Screen name="SignUpStep4" component={SignUpStep4Screen} />
            <Stack.Screen name="SignUpStep5" component={SignUpStep5Screen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
