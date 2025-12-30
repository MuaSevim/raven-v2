import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { Button, Header, ProgressIndicator } from '../../components/ui';
import { colors, typography, spacing, borderRadius, dimensions } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { useSignupStore } from '../../store/useSignupStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUpStep2'>;
};

// Generate arrays for picker
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - 16 - i);

type FieldType = 'day' | 'month' | 'year' | null;

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: { value: number; label: string }[];
  selectedValue: number | null;
  onSelect: (value: number) => void;
}

function PickerModal({ visible, onClose, title, items, selectedValue, onSelect }: PickerModalProps) {
  const selectedIndex = selectedValue ? items.findIndex(i => i.value === selectedValue) : -1;
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.value.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                modalStyles.item,
                selectedValue === item.value && modalStyles.itemSelected,
              ]}
              onPress={() => onSelect(item.value)}
            >
              <Text
                style={[
                  modalStyles.itemText,
                  selectedValue === item.value && modalStyles.itemTextSelected,
                ]}
              >
                {item.label}
              </Text>
              {selectedValue === item.value && (
                <Check size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={selectedIndex > 0 ? selectedIndex : 0}
          getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
        />
      </SafeAreaView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    height: 56,
  },
  itemSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  itemText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  itemTextSelected: {
    fontFamily: typography.fontFamily.semiBold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});

export default function SignUpStep2Screen({ navigation }: Props) {
  const { data, updateData } = useSignupStore();
  
  const [selectedDay, setSelectedDay] = useState<number | null>(data.birthDay || null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(data.birthMonth || null);
  const [selectedYear, setSelectedYear] = useState<number | null>(data.birthYear || null);
  const [activeField, setActiveField] = useState<FieldType>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if all fields are filled
  const isFormValid = selectedDay !== null && selectedMonth !== null && selectedYear !== null;

  const validateAge = (): boolean => {
    if (!selectedDay || !selectedMonth || !selectedYear) {
      setError('Please select your complete birthday');
      return false;
    }

    const birthDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 16) {
      setError('You must be at least 16 years old to sign up');
      return false;
    }
    
    return true;
  };

  const handleDaySelect = (value: number) => {
    setSelectedDay(value);
    setError(null);
    // Only auto-advance if month is empty
    if (selectedMonth === null) {
      setActiveField('month');
    } else if (selectedYear === null) {
      // Month filled but year empty, go to year
      setActiveField('year');
    } else {
      // All fields filled, close picker
      setActiveField(null);
    }
  };

  const handleMonthSelect = (value: number) => {
    setSelectedMonth(value);
    setError(null);
    // Only auto-advance if year is empty
    if (selectedYear === null) {
      setActiveField('year');
    } else {
      // Year already filled, close picker
      setActiveField(null);
    }
  };

  const handleYearSelect = (value: number) => {
    setSelectedYear(value);
    setActiveField(null); // Always close picker after year
    setError(null);
  };

  const handleNext = () => {
    if (!validateAge()) return;
    
    updateData({
      birthDay: selectedDay!,
      birthMonth: selectedMonth!,
      birthYear: selectedYear!,
    });
    navigation.navigate('SignUpStep3');
  };

  const dayItems = days.map(d => ({ value: d, label: d.toString() }));
  const yearItems = years.map(y => ({ value: y, label: y.toString() }));

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Raven"
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <ProgressIndicator totalSteps={5} currentStep={2} />
        </View>

        <Text style={styles.title}>What's your birthday?</Text>
        <Text style={styles.subtitle}>
          We need this to verify your age
        </Text>

        <View style={styles.fieldsRow}>
          {/* Day Field */}
          <TouchableOpacity
            style={[
              styles.field,
              styles.fieldDay,
              activeField === 'day' && styles.fieldActive,
              selectedDay !== null && styles.fieldFilled,
            ]}
            onPress={() => setActiveField('day')}
          >
            <Text style={[
              styles.fieldText,
              selectedDay === null && styles.fieldPlaceholder,
            ]}>
              {selectedDay !== null ? selectedDay : 'Day'}
            </Text>
            <ChevronDown size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Month Field */}
          <TouchableOpacity
            style={[
              styles.field,
              styles.fieldMonth,
              activeField === 'month' && styles.fieldActive,
              selectedMonth !== null && styles.fieldFilled,
            ]}
            onPress={() => setActiveField('month')}
          >
            <Text style={[
              styles.fieldText,
              selectedMonth === null && styles.fieldPlaceholder,
            ]}>
              {selectedMonth !== null ? months.find(m => m.value === selectedMonth)?.label : 'Month'}
            </Text>
            <ChevronDown size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Year Field */}
          <TouchableOpacity
            style={[
              styles.field,
              styles.fieldYear,
              activeField === 'year' && styles.fieldActive,
              selectedYear !== null && styles.fieldFilled,
            ]}
            onPress={() => setActiveField('year')}
          >
            <Text style={[
              styles.fieldText,
              selectedYear === null && styles.fieldPlaceholder,
            ]}>
              {selectedYear !== null ? selectedYear : 'Year'}
            </Text>
            <ChevronDown size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      
      <View style={styles.footer}>
        <Button title="Next" onPress={handleNext} disabled={!isFormValid} />
      </View>

      {/* Day Picker Modal */}
      <PickerModal
        visible={activeField === 'day'}
        onClose={() => setActiveField(null)}
        title="Select Day"
        items={dayItems}
        selectedValue={selectedDay}
        onSelect={handleDaySelect}
      />

      {/* Month Picker Modal */}
      <PickerModal
        visible={activeField === 'month'}
        onClose={() => setActiveField(null)}
        title="Select Month"
        items={months}
        selectedValue={selectedMonth}
        onSelect={handleMonthSelect}
      />

      {/* Year Picker Modal */}
      <PickerModal
        visible={activeField === 'year'}
        onClose={() => setActiveField(null)}
        title="Select Year"
        items={yearItems}
        selectedValue={selectedYear}
        onSelect={handleYearSelect}
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
    paddingHorizontal: spacing.lg,
  },
  progressContainer: {
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: dimensions.inputHeight,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  fieldDay: {
    flex: 0.8,
  },
  fieldMonth: {
    flex: 1.4,
  },
  fieldYear: {
    flex: 1,
  },
  fieldActive: {
    borderColor: colors.borderFocused,
    backgroundColor: colors.background,
  },
  fieldFilled: {
    backgroundColor: colors.background,
  },
  fieldText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  fieldPlaceholder: {
    color: colors.placeholder,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
