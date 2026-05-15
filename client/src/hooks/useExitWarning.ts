import { useEffect, useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShipmentStore } from '../store/useShipmentStore';

/**
 * Hook that intercepts hardware back button and navigation gestures
 * during shipment creation flow. Shows a confirmation dialog before
 * discarding the draft.
 *
 * @param enabled - Set to false to temporarily disable the warning
 */
export function useExitWarning(enabled = true) {
  const navigation = useNavigation<any>();
  const { resetDraft } = useShipmentStore();

  const showExitAlert = useCallback(() => {
    Alert.alert(
      'Cancel Shipment?',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            resetDraft();
            // Navigate to the DeliveriesTab inside the MainTabs
            navigation.navigate('MainTabs', { screen: 'DeliveriesTab' });
          },
        },
      ]
    );
  }, [navigation, resetDraft]);

  // Intercept Android hardware back button
  useEffect(() => {
    if (!enabled) return;

    const onBackPress = () => {
      showExitAlert();
      return true; // Prevent default back behaviour
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [enabled, showExitAlert]);

  // Intercept navigation gestures (swipe-back on iOS, header back)
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Allow programmatic navigations (e.g. after successful submit)
      if (e.data.action.type === 'NAVIGATE') return;

      e.preventDefault();
      showExitAlert();
    });

    return unsubscribe;
  }, [navigation, enabled, showExitAlert]);

  return { showExitAlert };
}
