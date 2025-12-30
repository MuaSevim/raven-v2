import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../theme';

/**
 * @deprecated This screen is replaced by ContactDetailsScreen + ReviewShipmentScreen
 * in the new 7-step shipment creation flow.
 */
export default function FinalizeDetailsScreen() {
  const navigation = useNavigation<any>();
  
  // This screen is deprecated - redirect to new flow
  React.useEffect(() => {
    navigation.replace('SetRoute');
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Redirecting to new flow...</Text>
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
  },
  text: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
});
