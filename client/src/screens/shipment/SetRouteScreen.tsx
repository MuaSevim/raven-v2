import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Search, X, Plane, MapPin, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StepHeader, BottomButton } from '../../components/shipment/StepComponents';
import { useShipmentStore } from '../../store/useShipmentStore';
import {
  getAllCountries,
  getCitiesByCountry,
  Country,
} from '../../services/locationApi';
import { colors, typography, spacing, borderRadius } from '../../theme';

type ModalType = 'originCountry' | 'originCity' | 'destCountry' | 'destCity' | null;

export default function SetRouteScreen() {
  const navigation = useNavigation<any>();
  const { draft, setDraft, totalSteps } = useShipmentStore();

  // Local state
  const [originCountry, setOriginCountry] = useState(draft.originCountry);
  const [originCountryCode, setOriginCountryCode] = useState(draft.originCountryCode);
  const [originCity, setOriginCity] = useState(draft.originCity);
  const [destCountry, setDestCountry] = useState(draft.destCountry);
  const [destCountryCode, setDestCountryCode] = useState(draft.destCountryCode);
  const [destCity, setDestCity] = useState(draft.destCity);

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load countries and pre-fill with user's location on mount
  useEffect(() => {
    loadCountries();
    prefillUserLocation();
  }, []);

  const prefillUserLocation = async () => {
    // Only pre-fill if origin is empty (new shipment)
    if (originCountry || originCity) return;

    try {
      const { API_URL } = await import('../../config');
      const { useAuthStore } = await import('../../store/useAuthStore');
      const user = useAuthStore.getState().user;

      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.country) {
          setOriginCountry(userData.country);
          setOriginCountryCode(userData.countryCode || '');
        }
        if (userData.city) {
          setOriginCity(userData.city);
        }
      }
    } catch (err) {
      // Silently fail - pre-fill is a nice-to-have
      console.log('Could not pre-fill user location');
    }
  };

  const loadCountries = async () => {
    setLoading(true);
    try {
      const data = await getAllCountries();
      setCountries(data);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (country: string) => {
    setLoading(true);
    setCities([]);
    try {
      const data = await getCitiesByCountry(country);
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: ModalType) => {
    setModalType(type);
    setSearchQuery('');

    if (type === 'originCity' && originCountry) {
      loadCities(originCountry);
    } else if (type === 'destCity' && destCountry) {
      loadCities(destCountry);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSearchQuery('');
  };

  const handleSelectCountry = (country: Country, isOrigin: boolean) => {
    if (isOrigin) {
      setOriginCountry(country.country);
      setOriginCountryCode(country.iso2);
      setOriginCity(''); // Reset city when country changes
    } else {
      setDestCountry(country.country);
      setDestCountryCode(country.iso2);
      setDestCity(''); // Reset city when country changes
    }
    closeModal();
  };

  const handleSelectCity = (city: string, isOrigin: boolean) => {
    if (isOrigin) {
      setOriginCity(city);
    } else {
      setDestCity(city);
    }
    closeModal();
  };

  const canProceed = originCountry && originCity && destCountry && destCity;

  const handleNext = () => {
    setDraft({
      originCountry,
      originCountryCode,
      originCity,
      destCountry,
      destCountryCode,
      destCity,
    });
    navigation.navigate('PackageDetails');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Filter data based on search query
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();

    switch (modalType) {
      case 'originCountry':
      case 'destCountry':
        return countries.filter(c =>
          c.country.toLowerCase().includes(query)
        );
      case 'originCity':
      case 'destCity':
        return cities.filter(c =>
          c.toLowerCase().includes(query)
        );

      default:
        return [];
    }
  };

  const renderModalItem = ({ item }: { item: any }) => {
    if (modalType === 'originCountry' || modalType === 'destCountry') {
      const country = item as Country;
      const isSelected = modalType === 'originCountry'
        ? country.country === originCountry
        : country.country === destCountry;

      return (
        <TouchableOpacity
          style={[styles.modalItem, isSelected && styles.modalItemSelected]}
          onPress={() => handleSelectCountry(country, modalType === 'originCountry')}
        >
          <Text style={styles.modalItemText}>{country.country}</Text>
          {isSelected && <Check size={20} color={colors.textPrimary} />}
        </TouchableOpacity>
      );
    }

    if (modalType === 'originCity' || modalType === 'destCity') {
      const city = item as string;
      const isSelected = modalType === 'originCity'
        ? city === originCity
        : city === destCity;

      return (
        <TouchableOpacity
          style={[styles.modalItem, isSelected && styles.modalItemSelected]}
          onPress={() => handleSelectCity(city, modalType === 'originCity')}
        >
          <Text style={styles.modalItemText}>{city}</Text>
          {isSelected && <Check size={20} color={colors.textPrimary} />}
        </TouchableOpacity>
      );
    }


    return null;
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'originCountry': return 'Select Origin Country';
      case 'originCity': return 'Select Origin City';
      case 'destCountry': return 'Select Destination Country';
      case 'destCity': return 'Select Destination City';

      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Set the Route"
        currentStep={1}
        totalSteps={totalSteps}
        onClose={handleClose}
        onBack={handleClose}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Origin Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.textPrimary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>From (Origin)</Text>
          </View>

          <TouchableOpacity
            style={styles.selectField}
            onPress={() => openModal('originCountry')}
          >
            <Text style={originCountry ? styles.selectText : styles.selectPlaceholder}>
              {originCountry || 'Select country'}
            </Text>
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectField, !originCountry && styles.selectFieldDisabled]}
            onPress={() => originCountry && openModal('originCity')}
            disabled={!originCountry}
          >
            <Text style={originCity ? styles.selectText : styles.selectPlaceholder}>
              {originCity || 'Select city'}
            </Text>
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Destination Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Plane size={20} color={colors.textPrimary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>To (Destination)</Text>
          </View>

          <TouchableOpacity
            style={styles.selectField}
            onPress={() => openModal('destCountry')}
          >
            <Text style={destCountry ? styles.selectText : styles.selectPlaceholder}>
              {destCountry || 'Select country'}
            </Text>
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectField, !destCountry && styles.selectFieldDisabled]}
            onPress={() => destCountry && openModal('destCity')}
            disabled={!destCountry}
          >
            <Text style={destCity ? styles.selectText : styles.selectPlaceholder}>
              {destCity || 'Select city'}
            </Text>
            <ChevronDown size={20} color={colors.textTertiary} />
          </TouchableOpacity>


        </View>
      </ScrollView>

      <BottomButton
        label="Next"
        onPress={handleNext}
        disabled={!canProceed}
      />

      {/* Selection Modal */}
      <Modal
        visible={modalType !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getModalTitle()}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
              <X size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
            </View>
          ) : (
            <FlatList
              data={getFilteredData()}
              keyExtractor={(item, index) =>
                typeof item === 'string' ? item : (item as any).iata || (item as any).country || index.toString()
              }
              renderItem={renderModalItem}
              contentContainerStyle={styles.modalList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {'No results found'}
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
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
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 56,
  },
  selectFieldDisabled: {
    opacity: 0.5,
  },
  selectText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  selectPlaceholder: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.placeholder,
    flex: 1,
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
  modalCloseBtn: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemSelected: {
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  modalItemText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
  },
});
