import React, { useState, useCallback } from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import {
  Home,
  Package,
  Settings,
  User
} from 'lucide-react-native';

import { HomeTab, DeliveriesTab, SettingsTab } from '../screens/tabs';
import ProfileScreen from '../screens/ProfileScreen';
import { colors, typography, borderRadius } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../utils/api';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Fetch unread count
  useFocusEffect(
    useCallback(() => {
      const fetchUnreadCount = async () => {
        if (!user) return;
        try {
          const data = await api.conversations.getUnread();
          setUnreadCount(data.unreadCount || 0);
        } catch (err: Error | unknown) {
          // Silently fail — badge is non-critical
        }
      };
      fetchUnreadCount();

      // Poll every 10 seconds for near-real-time badge updates
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }, [user])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchVerification = async () => {
        if (!user) return;
        try {
          const data = await api.auth.me();
          const isVerified = data?.verificationStatus === 'verified';
          setNeedsVerification(!isVerified);
        } catch {
          setNeedsVerification(false);
        }
      };
      fetchVerification();
    }, [user])
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeTab}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Home
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 1.5}
              />
              {/* Hide badge when user is ON Home — they already see the inbox indicator */}
              {unreadCount > 0 && !focused && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="DeliveriesTab"
        component={DeliveriesTab}
        options={{
          tabBarLabel: 'Deliveries',
          tabBarIcon: ({ color, focused }) => (
            <Package
              size={26}
              color={color}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <User
                size={26}
                color={color}
                strokeWidth={focused ? 2.5 : 1.5}
              />
              {needsVerification && !focused && (
                <View style={styles.profileDot} />
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsTab}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings
              size={26}
              color={color}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    height: Platform.OS === 'ios' ? 96 : 80,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    marginTop: 6,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 10,
    color: colors.textInverse,
  },
  profileDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textPrimary,
  },
});
