import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Package,
  MapPin,
  Calendar,
  DollarSign,
  BadgeCheck,
  Plus,
  AlertCircle,
  RefreshCw,
  Plane,
  Scale,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Travel {
  id: string;
  fromCountry: string;
  fromCity: string;
  fromAirportCode: string | null;
  toCountry: string;
  toCity: string;
  toAirportCode: string | null;
  departureDate: string;
  arrivalDate: string | null;
  availableWeight: number;
  weightUnit: string;
  pricePerKg: number | null;
  currency: string;
  flightNumber: string | null;
  status: string;
  traveler: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isVerified: boolean;
    country: string | null;
    city: string | null;
  };
}

// Filter chip component
interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Currency symbol helper
function getCurrencySymbol(currency: string) {
  switch (currency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'SEK': return 'kr';
    default: return '$';
  }
}

// Traveler card component
interface TravelerCardProps {
  travel: Travel;
  onPress: () => void;
}

function TravelerCard({ travel, onPress }: TravelerCardProps) {
  const travelerName = `${travel.traveler?.firstName || ''} ${travel.traveler?.lastName || ''}`.trim() || 'Unknown';
  const currencySymbol = getCurrencySymbol(travel.currency);

  return (
    <TouchableOpacity
      style={styles.travelerCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Traveler Info Row */}
      <View style={styles.travelerHeader}>
        <View style={styles.travelerInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {travelerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.travelerName}>{travelerName}</Text>
              {travel.traveler?.isVerified && (
                <BadgeCheck
                  size={16}
                  color={colors.textPrimary}
                  fill={colors.background}
                  strokeWidth={2}
                />
              )}
            </View>
            {travel.traveler?.city && (
              <Text style={styles.travelerLocation}>
                from {travel.traveler.city}
              </Text>
            )}
          </View>
        </View>
        {travel.pricePerKg && (
          <Text style={styles.priceText}>
            {currencySymbol}{travel.pricePerKg}/kg
          </Text>
        )}
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.routeText}>{travel.fromCity}</Text>
          {travel.fromAirportCode && (
            <Text style={styles.airportCode}>{travel.fromAirportCode}</Text>
          )}
        </View>
        <View style={styles.routeArrow}>
          <Plane size={14} color={colors.textTertiary} />
        </View>
        <View style={styles.routePoint}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.routeText}>{travel.toCity}</Text>
          {travel.toAirportCode && (
            <Text style={styles.airportCode}>{travel.toAirportCode}</Text>
          )}
        </View>
      </View>

      {/* Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(travel.departureDate)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Scale size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{travel.availableWeight} {travel.weightUnit} available</Text>
        </View>
      </View>

      {travel.flightNumber && (
        <View style={styles.flightRow}>
          <Text style={styles.flightLabel}>Flight:</Text>
          <Text style={styles.flightNumber}>{travel.flightNumber}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TravelersTab() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchTravels = async (showRefresh = false) => {
    if (!user) return;

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/travels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch travels');
      }

      const data = await response.json();
      setTravels(data);
    } catch (err: any) {
      console.error('Error fetching travels:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      const errorMessage = err.message || 'Failed to load travels';
      setError(errorMessage);
      Alert.alert('Error', `Could not load travels: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTravels();
    }, [user])
  );

  const handleAddTravel = () => {
    // TODO: Navigate to add travel screen
    console.log('Add travel');
  };

  const handleTravelPress = (travelId: string) => {
    // TODO: Navigate to travel detail screen
    console.log('Travel pressed:', travelId);
  };

  const handleRefresh = () => {
    fetchTravels(true);
  };

  const filters = [
    { id: 'date', label: 'Date' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'price', label: 'Price' },
    { id: 'verified', label: 'Verified' },
  ];

  // Filter and sort travels based on active filter
  const filteredTravels = [...travels].sort((a, b) => {
    switch (activeFilter) {
      case 'date':
        return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
      case 'capacity':
        return b.availableWeight - a.availableWeight;
      case 'price':
        return (a.pricePerKg || 0) - (b.pricePerKg || 0);
      case 'verified':
        return (b.traveler?.isVerified ? 1 : 0) - (a.traveler?.isVerified ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Travelers</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTravel}>
          <Plus size={20} color={colors.textInverse} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionLabel}>Filter by</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              isActive={activeFilter === filter.id}
              onPress={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Section Header */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionLabel}>
          {travels.length} traveler{travels.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.loadingText}>Loading travelers...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchTravels()}>
            <RefreshCw size={16} color={colors.textInverse} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : travels.length === 0 ? (
        <View style={styles.centerContainer}>
          <Plane size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No travelers available</Text>
          <Text style={styles.emptySubtext}>
            Be the first to post your upcoming trip!
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleAddTravel}>
            <Plus size={18} color={colors.textInverse} />
            <Text style={styles.createButtonText}>Post Your Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTravels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TravelerCard
              travel={item}
              onPress={() => handleTravelPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.textPrimary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  filtersScroll: {
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
  },
  emptyText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  createButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  // Traveler Card
  travelerCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  travelerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  travelerName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  travelerLocation: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  priceText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  routeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  airportCode: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    backgroundColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  routeArrow: {
    paddingHorizontal: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  flightLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  flightNumber: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
