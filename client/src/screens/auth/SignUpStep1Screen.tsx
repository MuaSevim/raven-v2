import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Button, Header, ProgressIndicator } from '../../components/ui';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { useSignupStore } from '../../store/useSignupStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUpStep1'>;
};

export default function SignUpStep1Screen({ navigation }: Props) {
  const { data, updateData } = useSignupStore();
  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  // Check if form is valid for enabling Next button
  const isFormValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const validateForm = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    
    updateData({ firstName: firstName.trim(), lastName: lastName.trim() });
    navigation.navigate('SignUpStep2');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Raven"
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressContainer}>
            <ProgressIndicator totalSteps={5} currentStep={1} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Let's get to know you.</Text>

            <Input
              label="First Name"
              placeholder="Liam"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) setErrors({ ...errors, firstName: undefined });
              }}
              error={errors.firstName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Input
              label="Last Name"
              placeholder="Carter"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) setErrors({ ...errors, lastName: undefined });
              }}
              error={errors.lastName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Button title="Next" onPress={handleNext} disabled={!isFormValid} />
        </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  progressContainer: {
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
