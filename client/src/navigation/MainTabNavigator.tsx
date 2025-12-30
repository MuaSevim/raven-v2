import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Home, 
  Package, 
  Plane, 
  ShoppingBag, 
  Settings 
} from 'lucide-react-native';

import { HomeTab, DeliveriesTab, TravelersTab, ShopTab, SettingsTab } from '../screens/tabs';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
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
            <Home 
              size={26} 
              color={color} 
              strokeWidth={focused ? 2.5 : 1.5}
            />
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
        name="TravelersTab"
        component={TravelersTab}
        options={{
          tabBarLabel: 'Travelers',
          tabBarIcon: ({ color, focused }) => (
            <Plane 
              size={26} 
              color={color} 
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopTab}
        options={{
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag 
              size={26} 
              color={color} 
              strokeWidth={focused ? 2.5 : 1.5}
            />
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
});
