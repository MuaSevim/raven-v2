import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Button } from '../components/ui';
import { colors, typography, spacing } from '../theme';
import { RootStackParamList } from '../navigation';
import { useAuthStore } from '../store/useAuthStore';
import { auth } from '../services/firebaseConfig';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { setUser } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleExplore = () => {
    // User is already signed in from Step4, just update the auth store
    // This will trigger the navigation to MainTabs automatically
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    } else {
      // Fallback: reset navigation to SignIn if no user
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        })
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.centerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon / Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/raven-logo-black.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Success Message */}
          <Text style={styles.title}>Sign Up Successful!</Text>
          <Text style={styles.subtitle}>
            Welcome to Raven{'\n'}
            Your journey begins now
          </Text>

          {/* Decorative element */}
          <View style={styles.divider} />

          <Text style={styles.tagline}>"Travel for free"</Text>
        </Animated.View>
      </View>

      {/* Footer with CTA */}
      <View style={styles.footer}>
        <Button
          title="Explore the Raven!"
          onPress={handleExplore}
        />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  centerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing['2xl'],
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: spacing.xl,
    borderRadius: 1,
  },
  tagline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
