import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Upload, Camera, X, Package } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { StepHeader, BottomButton } from '../../components/shipment/StepComponents';
import { useShipmentStore } from '../../store/useShipmentStore';
import { colors, typography, spacing, borderRadius } from '../../theme';

type WeightUnit = 'kg' | 'lb' | 'g';

const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'g', label: 'Grams (g)' },
];

export default function PackageDetailsScreen() {
  const navigation = useNavigation<any>();
  const { draft, setDraft, totalSteps } = useShipmentStore();

  const [weight, setWeight] = useState(draft.weight);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(draft.weightUnit);
  const [content, setContent] = useState(draft.content);
  const [imageUri, setImageUri] = useState<string | null>(draft.packageImageUri);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const canProceed = weight.length > 0 && parseFloat(weight) > 0 && content.length > 0 && imageUri !== null;

  const handleWeightChange = (value: string) => {
    // Allow only numbers and one decimal point
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) return;
    setWeight(sanitized);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Package Photo',
      'Choose how you want to add the photo',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleNext = () => {
    setDraft({
      weight,
      weightUnit,
      content,
      packageImageUri: imageUri,
    });
    navigation.navigate('DeliveryWindow');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('MainTabs');
  };

  const getUnitLabel = () => {
    return WEIGHT_UNITS.find(u => u.value === weightUnit)?.label || 'kg';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Package Details"
        currentStep={2}
        totalSteps={totalSteps}
        onClose={handleClose}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Weight Section */}
        <View style={styles.sectionHeader}>
          <Package size={20} color={colors.textPrimary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Package Weight</Text>
        </View>

        <View style={styles.weightRow}>
          <View style={styles.weightInputContainer}>
            <TextInput
              style={styles.weightInput}
              value={weight}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
              placeholder="1.25"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <TouchableOpacity
            style={styles.unitSelector}
            onPress={() => setShowUnitPicker(!showUnitPicker)}
          >
            <Text style={styles.unitText}>{weightUnit}</Text>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showUnitPicker && (
          <View style={styles.unitPicker}>
            {WEIGHT_UNITS.map((unit) => (
              <TouchableOpacity
                key={unit.value}
                style={[
                  styles.unitOption,
                  weightUnit === unit.value && styles.unitOptionSelected,
                ]}
                onPress={() => {
                  setWeightUnit(unit.value);
                  setShowUnitPicker(false);
                }}
              >
                <Text style={[
                  styles.unitOptionText,
                  weightUnit === unit.value && styles.unitOptionTextSelected,
                ]}>
                  {unit.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Content Section */}
        <Text style={styles.label}>Package Contents</Text>
        <Text style={styles.labelHint}>Describe what's inside the package</Text>

        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="e.g., Electronics, Documents, Clothing..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.disclaimer}>
          ⚠️ Raven is not responsible for illegal items. Please review airport and
          international shipping <Text style={styles.link}>policies</Text>.
        </Text>

        {/* Image Upload Section */}
        <Text style={styles.label}>Package Photo</Text>
        <Text style={styles.labelHint}>Required - helps travelers identify your package</Text>

        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
              <X size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeImageBtn} onPress={showImageOptions}>
              <Camera size={16} color={colors.textPrimary} />
              <Text style={styles.changeImageText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadContainer} onPress={showImageOptions}>
            <View style={styles.uploadIconContainer}>
              <Upload size={28} color={colors.textPrimary} strokeWidth={1.5} />
            </View>
            <Text style={styles.uploadTitle}>Upload Photo</Text>
            <Text style={styles.uploadSubtitle}>
              Take a photo or choose from your gallery
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BottomButton
        label="Next"
        onPress={handleNext}
        disabled={!canProceed}
      />
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
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginTop: spacing.xl,
  },
  labelHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  // Weight
  weightRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weightInputContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  weightInput: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    minHeight: 56,
    minWidth: 80,
    justifyContent: 'center',
  },
  unitText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  unitPicker: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  unitOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unitOptionSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  unitOptionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  unitOptionTextSelected: {
    fontFamily: typography.fontFamily.semiBold,
  },
  // Content
  contentInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: 100,
  },
  disclaimer: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  link: {
    fontFamily: typography.fontFamily.semiBold,
    textDecorationLine: 'underline',
  },
  // Upload
  uploadContainer: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    borderStyle: 'dashed',
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  uploadTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  uploadSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Image Preview
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.xl,
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  changeImageText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
});
