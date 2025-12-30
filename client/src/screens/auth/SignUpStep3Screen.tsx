import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronDown, Search, X, RefreshCw } from 'lucide-react-native';
import { Button, Header, ProgressIndicator } from '../../components/ui';
import { colors, typography, spacing, borderRadius, dimensions } from '../../theme';
import { RootStackParamList } from '../../navigation';
import { useSignupStore } from '../../store/useSignupStore';
import { 
  fetchCountries, 
  fetchCities, 
  searchCountries,
  Country 
} from '../../services/locationService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUpStep3'>;
};

interface SelectModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: { label: string; value: string; flag?: string }[];
  onSelect: (item: { label: string; value: string; flag?: string }) => void;
  searchPlaceholder: string;
  isLoading?: boolean;
  onSearch?: (query: string) => { label: string; value: string; flag?: string }[];
}

function SelectModal({
  visible,
  onClose,
  title,
  items,
  onSelect,
  searchPlaceholder,
  isLoading = false,
  onSearch,
}: SelectModalProps) {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    
    if (onSearch) {
      return onSearch(search);
    }
    
    // Standard search
    return items.filter(item =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search, onSearch]);

  const handleSelect = (item: { label: string; value: string; flag?: string }) => {
    onSelect(item);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleSelect(item)}
              >
                {item.flag && <Text style={styles.flag}>{item.flag}</Text>}
                <Text style={styles.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function SignUpStep3Screen({ navigation }: Props) {
  const { data, updateData } = useSignupStore();
  
  // Countries state
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  
  // Selection state
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState(data.city || '');
  
  // Cities state
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  
  // Modal state
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  
  // Form state
  const [errors, setErrors] = useState<{ country?: string; city?: string }>({});

  // Form validity
  const isFormValid = selectedCountry !== null && selectedCity !== '';

  // Fetch countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Restore previously selected country if exists
  useEffect(() => {
    if (data.country && countries.length > 0 && !selectedCountry) {
      const found = countries.find(c => c.name === data.country);
      if (found) {
        setSelectedCountry(found);
      }
    }
  }, [countries, data.country]);

  // Fetch cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      loadCities(selectedCountry.name);
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  const loadCountries = async () => {
    setIsLoadingCountries(true);
    setCountriesError(null);
    
    try {
      const fetchedCountries = await fetchCountries();
      setCountries(fetchedCountries);
    } catch (error) {
      setCountriesError('Failed to load countries. Please try again.');
      console.error('Error loading countries:', error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const loadCities = async (countryName: string) => {
    setIsLoadingCities(true);
    setCities([]);
    
    try {
      const fetchedCities = await fetchCities(countryName);
      setCities(fetchedCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Transform countries for modal
  const countryItems = useMemo(
    () => countries.map(c => ({
      label: c.name,
      value: c.code,
      flag: c.flag,
    })),
    [countries]
  );

  // Transform cities for modal
  const cityItems = useMemo(
    () => cities.map(city => ({ label: city, value: city })),
    [cities]
  );

  // Search handler for countries (includes native names)
  const handleCountrySearch = (query: string) => {
    const filtered = searchCountries(countries, query);
    return filtered.map(c => ({
      label: c.name,
      value: c.code,
      flag: c.flag,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { country?: string; city?: string } = {};

    if (!selectedCountry) {
      newErrors.country = 'Please select your country';
    }

    if (!selectedCity) {
      newErrors.city = 'Please select your city';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    
    updateData({
      country: selectedCountry!.name,
      countryCode: selectedCountry!.code,
      city: selectedCity,
    });
    navigation.navigate('SignUpStep4');
  };

  const handleCountrySelect = (item: { label: string; value: string; flag?: string }) => {
    const country = countries.find(c => c.code === item.value);
    if (country) {
      setSelectedCountry(country);
      setSelectedCity(''); // Reset city when country changes
      if (errors.country) setErrors({ ...errors, country: undefined });
    }
  };

  const handleCitySelect = (item: { label: string; value: string }) => {
    setSelectedCity(item.value);
    if (errors.city) setErrors({ ...errors, city: undefined });
  };

  // Loading state for countries
  if (isLoadingCountries) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Raven"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading countries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (countriesError) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Raven"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{countriesError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCountries}>
            <RefreshCw size={20} color={colors.background} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Raven"
        showBack
        onBack={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <ProgressIndicator totalSteps={5} currentStep={3} />
        </View>

        <Text style={styles.title}>Where are you based?</Text>

        {/* Country Select */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Country</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              errors.country && styles.selectButtonError,
            ]}
            onPress={() => setShowCountryModal(true)}
          >
            {selectedCountry ? (
              <>
                <Text style={styles.flag}>{selectedCountry.flag}</Text>
                <Text style={styles.selectText}>{selectedCountry.name}</Text>
              </>
            ) : (
              <Text style={styles.selectPlaceholder}>Select country</Text>
            )}
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          {errors.country && (
            <Text style={styles.errorText}>{errors.country}</Text>
          )}
        </View>

        {/* City Select */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>City</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              errors.city && styles.selectButtonError,
              !selectedCountry && styles.selectButtonDisabled,
            ]}
            onPress={() => selectedCountry && !isLoadingCities && setShowCityModal(true)}
            disabled={!selectedCountry || isLoadingCities}
          >
            {isLoadingCities ? (
              <>
                <ActivityIndicator size="small" color={colors.textTertiary} />
                <Text style={[styles.selectPlaceholder, { marginLeft: spacing.sm }]}>
                  Loading cities...
                </Text>
              </>
            ) : selectedCity ? (
              <Text style={styles.selectText}>{selectedCity}</Text>
            ) : (
              <Text style={styles.selectPlaceholder}>
                {selectedCountry ? 'Select city' : 'Select country first'}
              </Text>
            )}
            {!isLoadingCities && <ChevronDown size={20} color={colors.textTertiary} />}
          </TouchableOpacity>
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Next" onPress={handleNext} disabled={!isFormValid} />
      </View>

      {/* Country Modal */}
      <SelectModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        title="Select Country"
        items={countryItems}
        onSelect={handleCountrySelect}
        searchPlaceholder="Search countries..."
        onSearch={handleCountrySearch}
      />

      {/* City Modal */}
      <SelectModal
        visible={showCityModal}
        onClose={() => setShowCityModal(false)}
        title="Select City"
        items={cityItems}
        onSelect={handleCitySelect}
        searchPlaceholder="Search cities..."
        isLoading={isLoadingCities}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: dimensions.inputHeight,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  selectButtonError: {
    borderColor: colors.error,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  selectPlaceholder: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.placeholder,
  },
  flag: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  modalItemText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  retryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.background,
  },
});
