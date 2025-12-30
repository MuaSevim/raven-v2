import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StepHeader, BottomButton } from '../../components/shipment/StepComponents';
import { useShipmentStore } from '../../store/useShipmentStore';
import { colors, typography, spacing, borderRadius } from '../../theme';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return `${MONTHS[date.getMonth()].substring(0, 3)} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function DeliveryWindowScreen() {
  const navigation = useNavigation<any>();
  const { draft, setDraft, totalSteps } = useShipmentStore();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [startDate, setStartDate] = useState<Date | null>(draft.dateStart);
  const [endDate, setEndDate] = useState<Date | null>(draft.dateEnd);
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const canProceed = startDate && endDate;
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleDatePress = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Don't allow past dates
    if (selectedDate < today) return;
    
    if (!startDate || (startDate && endDate)) {
      // Start fresh selection
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (selectedDate < startDate) {
      // Selected before start, make it new start
      setStartDate(selectedDate);
    } else if (selectedDate.toDateString() === startDate.toDateString()) {
      // Same date clicked, reset
      setStartDate(null);
      setEndDate(null);
    } else {
      // Set end date
      setEndDate(selectedDate);
    }
  };
  
  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date > startDate && date < endDate;
  };
  
  const isStart = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === startDate.toDateString();
  };
  
  const isEnd = (day: number) => {
    if (!endDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === endDate.toDateString();
  };
  
  const isPast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const isToday = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };
  
  const handleNext = () => {
    setDraft({
      dateStart: startDate,
      dateEnd: endDate,
    });
    navigation.navigate('SetPrice');
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  
  // Calculate days between
  const daysBetween = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Delivery Window"
        currentStep={4}
        totalSteps={totalSteps}
        onClose={handleBack}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Calendar size={24} color={colors.textPrimary} strokeWidth={2} />
          <Text style={styles.question}>
            When do you want your package to be delivered?
          </Text>
        </View>
        
        <Text style={styles.hint}>
          Select a start date and end date for the delivery window
        </Text>
        
        {/* Selected Range Display */}
        {(startDate || endDate) && (
          <View style={styles.rangeDisplay}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>From</Text>
              <Text style={styles.rangeValue}>
                {startDate ? formatDate(startDate) : 'Select date'}
              </Text>
            </View>
            <View style={styles.rangeDivider} />
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>To</Text>
              <Text style={styles.rangeValue}>
                {endDate ? formatDate(endDate) : 'Select date'}
              </Text>
            </View>
          </View>
        )}
        
        {daysBetween > 0 && (
          <Text style={styles.daysCount}>
            {daysBetween} day{daysBetween > 1 ? 's' : ''} delivery window
          </Text>
        )}
        
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRight size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Day Headers */}
        <View style={styles.daysHeader}>
          {DAYS.map((day, index) => (
            <Text key={index} style={styles.dayHeader}>{day}</Text>
          ))}
        </View>
        
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const past = day !== null && isPast(day);
            const start = day !== null && isStart(day);
            const end = day !== null && isEnd(day);
            const inRange = day !== null && isInRange(day);
            const todayDay = day !== null && isToday(day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  start && styles.daySelected,
                  end && styles.daySelected,
                  inRange && styles.dayInRange,
                  start && endDate && styles.dayRangeStart,
                  end && styles.dayRangeEnd,
                ]}
                onPress={() => day !== null && !past && handleDatePress(day)}
                disabled={day === null || past}
              >
                {day !== null && (
                  <View style={[
                    styles.dayInner,
                    todayDay && !start && !end && styles.dayToday,
                  ]}>
                    <Text
                      style={[
                        styles.dayText,
                        past && styles.dayTextPast,
                        (start || end) && styles.dayTextSelected,
                        inRange && styles.dayTextInRange,
                        todayDay && !start && !end && styles.dayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
    paddingHorizontal: spacing.lg,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  question: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  hint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  // Range Display
  rangeDisplay: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rangeItem: {
    flex: 1,
  },
  rangeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  rangeValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  rangeDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  daysCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // Month Navigation
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navButton: {
    padding: spacing.sm,
  },
  monthText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  // Days Header
  daysHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayInner: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  daySelected: {
    backgroundColor: colors.textPrimary,
    borderRadius: 20,
  },
  dayRangeStart: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  dayRangeEnd: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  dayInRange: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 0,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  dayText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  dayTextPast: {
    color: colors.textDisabled,
  },
  dayTextSelected: {
    color: colors.textInverse,
    fontFamily: typography.fontFamily.semiBold,
  },
  dayTextInRange: {
    color: colors.textPrimary,
  },
  dayTextToday: {
    fontFamily: typography.fontFamily.semiBold,
  },
});
