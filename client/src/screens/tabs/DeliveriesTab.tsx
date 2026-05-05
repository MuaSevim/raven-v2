import React, { useState, useEffect, useCallback } from "react";
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
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Scale,
  Calendar,
  DollarSign,
  CheckCircle,
  MapPin,
  Navigation,
  ChevronDown,
  Search,
  X,
  Check,
  Package,
  FileText,
  Mail,
  Box,
  BadgeCheck,
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../utils/api";
import type { Shipment } from "../../types/api";
import { getAllCountries, getCitiesByCountry, Country } from "../../services/locationApi";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { normalizeText } from "../../utils/text";
import SkeletonLoader from "../../components/home/SkeletonLoader";
type RouteModalType = "originCountry" | "originCity" | "destCountry" | "destCity" | null;




// Filter chip component
interface FilterChipProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onPress: () => void;
}

function FilterChip({ label, icon, isActive, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text
        style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Get icon for package type
function getTypeIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "document":
      return <FileText size={14} color={colors.textSecondary} strokeWidth={1.5} />;
    case "envelope":
      return <Mail size={14} color={colors.textSecondary} strokeWidth={1.5} />;
    case "box":
      return <Box size={14} color={colors.textSecondary} strokeWidth={1.5} />;
    default:
      return <Package size={14} color={colors.textSecondary} strokeWidth={1.5} />;
  }
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

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Shipment card component
interface ShipmentCardProps {
  shipment: Shipment;
  onPress: () => void;
}

function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
  const senderName = `${shipment.sender?.firstName || ''} ${shipment.sender?.lastName || ''}`.trim() || 'Unknown';
  const currencySymbol = getCurrencySymbol(shipment.currency);

  return (
    <TouchableOpacity
      style={styles.shipmentCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top Row: Route and Price */}
      <View style={styles.shipmentHeader}>
        <View style={styles.routeContainer}>
          <Text style={styles.routeText}>
            {shipment.originCity} → {shipment.destCity}
          </Text>
        </View>
        <Text style={styles.priceText}>{currencySymbol}{shipment.price}</Text>
      </View>

      {/* Sender info */}
      <View style={styles.travelerRow}>
        <Text style={styles.travelerName}>{senderName}</Text>
        {shipment.sender?.isVerified && (
          <BadgeCheck
            size={16}
            color={colors.textPrimary}
            fill={colors.background}
            strokeWidth={2}
          />
        )}
      </View>

      {/* Bottom Row: Date Range and Weight */}
      <View style={styles.shipmentDetails}>
        <View style={styles.weightContainer}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={styles.weightText}>
            {formatDate(shipment.dateStart || new Date().toISOString())} - {formatDate(shipment.dateEnd || new Date().toISOString())}
          </Text>
        </View>
        <View style={styles.weightContainer}>
          {getTypeIcon(shipment.packageType || '')}
          <Text style={styles.weightText}>{shipment.weight} {shipment.weightUnit}</Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shipment.status) + '20' }]}>
        <Text style={[styles.statusText, { color: getStatusColor(shipment.status) }]}>
          {shipment.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return '#22C55E';
    case 'MATCHED': return '#3B82F6';
    case 'ON_WAY': return '#F59E0B';
    case 'DELIVERED': return '#8B5CF6';
    case 'CANCELLED': return '#EF4444';
    default: return colors.textSecondary;
  }
}

function ShipmentCardSkeleton() {
  return (
    <View style={styles.shipmentCard}>
      <View style={styles.shipmentHeader}>
        <SkeletonLoader width="60%" height={18} />
        <SkeletonLoader width={60} height={18} />
      </View>
      <View style={styles.travelerRow}>
        <SkeletonLoader width="40%" height={14} />
      </View>
      <View style={styles.shipmentDetails}>
        <SkeletonLoader width="45%" height={14} />
        <SkeletonLoader width="30%" height={14} />
      </View>
      <SkeletonLoader width={80} height={16} borderRadius={12} />
    </View>
  );
}

export default function DeliveriesTab() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeFilter, setRouteFilter] = useState({
    originCountry: "",
    originCity: "",
    destCountry: "",
    destCity: "",
  });
  const [routeDraft, setRouteDraft] = useState({
    originCountry: "",
    originCity: "",
    destCountry: "",
    destCity: "",
  });
  const [routeModalType, setRouteModalType] = useState<RouteModalType>(null);
  const [routeSearchQuery, setRouteSearchQuery] = useState("");
  const [routeCountries, setRouteCountries] = useState<Country[]>([]);
  const [routeCities, setRouteCities] = useState<string[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const fetchShipments = async (showRefresh = false) => {
    if (!user) return;

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const response = await api.shipments.getAvailableShipments();
      const data = response.data || [];
      setShipments(data);
    } catch (err: Error | unknown) {
      console.error('Error fetching shipments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shipments';
      setError(errorMessage);
      Alert.alert('Error', `Could not load shipments: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchShipments();
    }, [user])
  );

  useEffect(() => {
    if (showRouteModal && routeCountries.length === 0) {
      loadRouteCountries();
    }
  }, [showRouteModal, routeCountries.length]);

  const handleAddDelivery = () => {
    navigation.navigate('SetRoute');
  };

  const handleShipmentPress = (shipmentId: string) => {
    navigation.navigate('ShipmentDetail', { shipmentId });
  };

  const handleRefresh = () => {
    fetchShipments(true);
  };

  const loadRouteCountries = async () => {
    setRouteLoading(true);
    try {
      const data = await getAllCountries();
      setRouteCountries(data);
    } catch (error) {
      console.error("Failed to load countries:", error);
    } finally {
      setRouteLoading(false);
    }
  };

  const loadRouteCities = async (country: string) => {
    setRouteLoading(true);
    setRouteCities([]);
    try {
      const data = await getCitiesByCountry(country);
      setRouteCities(data);
    } catch (error) {
      console.error("Failed to load cities:", error);
    } finally {
      setRouteLoading(false);
    }
  };

  const openRouteModal = (type: RouteModalType) => {
    setRouteModalType(type);
    setRouteSearchQuery("");

    if (type === "originCity" && routeDraft.originCountry) {
      loadRouteCities(routeDraft.originCountry);
    } else if (type === "destCity" && routeDraft.destCountry) {
      loadRouteCities(routeDraft.destCountry);
    }
  };

  const closeRouteModal = () => {
    setRouteModalType(null);
    setRouteSearchQuery("");
  };

  const handleRouteCountrySelect = (country: Country, isOrigin: boolean) => {
    if (isOrigin) {
      setRouteDraft((prev) => ({
        ...prev,
        originCountry: country.country,
        originCity: "",
      }));
      setRouteModalType("originCity");
      setRouteSearchQuery("");
      loadRouteCities(country.country);
      return;
    }

    setRouteDraft((prev) => ({
      ...prev,
      destCountry: country.country,
      destCity: "",
    }));
    setRouteModalType("destCity");
    setRouteSearchQuery("");
    loadRouteCities(country.country);
  };

  const handleRouteCitySelect = (city: string, isOrigin: boolean) => {
    if (isOrigin) {
      setRouteDraft((prev) => ({ ...prev, originCity: city }));
    } else {
      setRouteDraft((prev) => ({ ...prev, destCity: city }));
    }
    closeRouteModal();
  };

  const getRouteFilteredData = (): Array<Country | string> => {
    const query = normalizeText(routeSearchQuery);

    switch (routeModalType) {
      case "originCountry":
      case "destCountry":
        return routeCountries.filter((c) =>
          normalizeText(c.country).includes(query)
        );
      case "originCity":
      case "destCity":
        return routeCities.filter((c) =>
          normalizeText(c).includes(query)
        );
      default:
        return [];
    }
  };

  const renderRouteModalItem = ({ item }: { item: Country | string }) => {
    if (routeModalType === "originCountry" || routeModalType === "destCountry") {
      const country = item as Country;
      const isSelected = routeModalType === "originCountry"
        ? country.country === routeDraft.originCountry
        : country.country === routeDraft.destCountry;

      return (
        <TouchableOpacity
          style={[styles.modalItem, isSelected && styles.modalItemSelected]}
          onPress={() => handleRouteCountrySelect(country, routeModalType === "originCountry")}
        >
          <Text style={styles.modalItemText}>{country.country}</Text>
          {isSelected && <Check size={20} color={colors.textPrimary} />}
        </TouchableOpacity>
      );
    }

    if (routeModalType === "originCity" || routeModalType === "destCity") {
      const city = item as string;
      const isSelected = routeModalType === "originCity"
        ? city === routeDraft.originCity
        : city === routeDraft.destCity;

      return (
        <TouchableOpacity
          style={[styles.modalItem, isSelected && styles.modalItemSelected]}
          onPress={() => handleRouteCitySelect(city, routeModalType === "originCity")}
        >
          <Text style={styles.modalItemText}>{city}</Text>
          {isSelected && <Check size={20} color={colors.textPrimary} />}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const getRouteModalTitle = () => {
    switch (routeModalType) {
      case "originCountry":
        return "Select Origin Country";
      case "originCity":
        return "Select Origin City";
      case "destCountry":
        return "Select Destination Country";
      case "destCity":
        return "Select Destination City";
      default:
        return "";
    }
  };

  const filters = [
    {
      id: "weight",
      label: "Weight",
      icon: <Scale size={16} color={activeFilter === "weight" ? colors.textInverse : colors.textPrimary} strokeWidth={1.5} />,
    },
    {
      id: "date",
      label: "Date",
      icon: <Calendar size={16} color={activeFilter === "date" ? colors.textInverse : colors.textPrimary} strokeWidth={1.5} />,
    },
    {
      id: "price",
      label: "Price",
      icon: <DollarSign size={16} color={activeFilter === "price" ? colors.textInverse : colors.textPrimary} strokeWidth={1.5} />,
    },
    {
      id: "status",
      label: "Status",
      icon: <CheckCircle size={16} color={activeFilter === "status" ? colors.textInverse : colors.textPrimary} strokeWidth={1.5} />,
    },
  ];

  const hasRouteFilter =
    Boolean(routeFilter.originCountry) ||
    Boolean(routeFilter.originCity) ||
    Boolean(routeFilter.destCountry) ||
    Boolean(routeFilter.destCity);

  const normalizedOriginCountry = routeFilter.originCountry.trim().toLowerCase();
  const normalizedOriginCity = routeFilter.originCity.trim().toLowerCase();
  const normalizedDestCountry = routeFilter.destCountry.trim().toLowerCase();
  const normalizedDestCity = routeFilter.destCity.trim().toLowerCase();

  const filteredShipments = [...shipments]
    .filter(s => s.status !== 'DELIVERED' && s.status !== 'CANCELLED' && s.status !== 'MATCHED')
    .filter(s => {
      if (normalizedOriginCountry) {
        const originCountry = s.originCountry?.toLowerCase() || '';
        if (!originCountry.includes(normalizedOriginCountry)) return false;
      }
      if (normalizedOriginCity) {
        const originCity = s.originCity?.toLowerCase() || '';
        if (!originCity.includes(normalizedOriginCity)) return false;
      }
      return true;
    })
    .filter(s => {
      if (normalizedDestCountry) {
        const destCountry = s.destCountry?.toLowerCase() || '';
        if (!destCountry.includes(normalizedDestCountry)) return false;
      }
      if (normalizedDestCity) {
        const destCity = s.destCity?.toLowerCase() || '';
        if (!destCity.includes(normalizedDestCity)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (activeFilter) {
        case 'weight':
          return (b.weight || 0) - (a.weight || 0);
        case 'date':
          return new Date(a.dateStart || 0).getTime() - new Date(b.dateStart || 0).getTime();
        case 'price':
          return b.price - a.price;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shipments</Text>
        {shipments.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddDelivery}>
            <Plus size={20} color={colors.textInverse} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.sectionLabel}>Filter options</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <FilterChip
            label="Route"
            icon={
              <MapPin
                size={16}
                color={hasRouteFilter ? colors.textInverse : colors.textPrimary}
                strokeWidth={1.5}
              />
            }
            isActive={hasRouteFilter}
            onPress={() => {
              setRouteDraft(routeFilter);
              setShowRouteModal(true);
            }}
          />
          {filters.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              icon={filter.icon}
              isActive={activeFilter === filter.id}
              onPress={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Section Header */}
      {filteredShipments.length > 0 && (
        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>
            {filteredShipments.length} available shipment{filteredShipments.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.listContent}>
          {Array.from({ length: 4 }).map((_, index) => (
            <ShipmentCardSkeleton key={`shipment-skeleton-${index}`} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchShipments()}>
            <RefreshCw size={16} color={colors.textInverse} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : shipments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Package size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No shipments available</Text>
          <Text style={styles.emptySubtext}>Be the first to post a delivery request!</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleAddDelivery}>
            <Plus size={18} color={colors.textInverse} />
            <Text style={styles.createButtonText}>Create Shipment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredShipments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShipmentCard
              shipment={item}
              onPress={() => handleShipmentPress(item.id)}
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

      <Modal
        visible={showRouteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.routeModalOverlay}>
          <View style={styles.routeModalContent}>
            <View style={styles.routeModalHeader}>
              <Text style={styles.routeModalTitle}>Set the Route</Text>
              <TouchableOpacity
                style={styles.routeModalClose}
                onPress={() => setShowRouteModal(false)}
              >
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.routeSection}>
              <View style={styles.routeSectionHeader}>
                <MapPin size={18} color={colors.textPrimary} strokeWidth={2} />
                <Text style={styles.routeSectionTitle}>From (Origin)</Text>
              </View>

              <TouchableOpacity
                style={styles.selectField}
                onPress={() => openRouteModal("originCountry")}
              >
                <Text
                  style={
                    routeDraft.originCountry
                      ? styles.selectText
                      : styles.selectPlaceholder
                  }
                >
                  {routeDraft.originCountry || "Select country"}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectField}
                onPress={() => openRouteModal("originCity")}
                disabled={!routeDraft.originCountry}
              >
                <Text
                  style={
                    routeDraft.originCity
                      ? styles.selectText
                      : styles.selectPlaceholder
                  }
                >
                  {routeDraft.originCity ||
                    (routeDraft.originCountry
                      ? "Select city"
                      : "Select country first")}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.routeSection}>
              <View style={styles.routeSectionHeader}>
                <Navigation size={18} color={colors.textPrimary} strokeWidth={2} />
                <Text style={styles.routeSectionTitle}>To (Destination)</Text>
              </View>

              <TouchableOpacity
                style={styles.selectField}
                onPress={() => openRouteModal("destCountry")}
              >
                <Text
                  style={
                    routeDraft.destCountry
                      ? styles.selectText
                      : styles.selectPlaceholder
                  }
                >
                  {routeDraft.destCountry || "Select country"}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectField}
                onPress={() => openRouteModal("destCity")}
                disabled={!routeDraft.destCountry}
              >
                <Text
                  style={
                    routeDraft.destCity
                      ? styles.selectText
                      : styles.selectPlaceholder
                  }
                >
                  {routeDraft.destCity ||
                    (routeDraft.destCountry
                      ? "Select city"
                      : "Select country first")}
                </Text>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.routeModalActions}>
              <TouchableOpacity
                style={[styles.routeModalButton, styles.routeModalClear]}
                onPress={() => {
                  setRouteFilter({
                    originCountry: "",
                    originCity: "",
                    destCountry: "",
                    destCity: "",
                  });
                  setRouteDraft({
                    originCountry: "",
                    originCity: "",
                    destCountry: "",
                    destCity: "",
                  });
                  setShowRouteModal(false);
                }}
              >
                <Text style={styles.routeModalClearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.routeModalButton, styles.routeModalApply]}
                onPress={() => {
                  setRouteFilter({
                    originCountry: routeDraft.originCountry.trim(),
                    originCity: routeDraft.originCity.trim(),
                    destCountry: routeDraft.destCountry.trim(),
                    destCity: routeDraft.destCity.trim(),
                  });
                  setShowRouteModal(false);
                }}
              >
                <Text style={styles.routeModalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {routeModalType && (
        <Modal
          visible
          animationType="slide"
          onRequestClose={closeRouteModal}
        >
          <SafeAreaView style={styles.routePickerContainer}>
            <View style={styles.routePickerHeader}>
              <Text style={styles.routePickerTitle}>{getRouteModalTitle()}</Text>
              <TouchableOpacity onPress={closeRouteModal}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.routePickerSearch}>
              <Search size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.routePickerInput}
                placeholder="Search..."
                placeholderTextColor={colors.textTertiary}
                value={routeSearchQuery}
                onChangeText={setRouteSearchQuery}
                autoFocus
              />
            </View>

            {routeLoading ? (
              <View style={styles.routePickerLoading}>
                <ActivityIndicator size="large" color={colors.textPrimary} />
              </View>
            ) : (
              <FlatList
                data={getRouteFilteredData()}
                keyExtractor={(item, index) =>
                  typeof item === "string" ? `${item}-${index}` : item.iso2
                }
                renderItem={renderRouteModalItem}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </SafeAreaView>
        </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize["2xl"],
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
  routeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  routeModalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  routeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  routeModalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  routeModalClose: {
    padding: spacing.xs,
  },
  routeSection: {
    marginBottom: spacing.md,
  },
  routeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  routeSectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  selectPlaceholder: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
  },
  routeModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  routeModalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  routeModalClear: {
    backgroundColor: colors.backgroundSecondary,
  },
  routeModalApply: {
    backgroundColor: colors.textPrimary,
  },
  routeModalClearText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  routeModalApplyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  routePickerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  routePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  routePickerTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  routePickerSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  routePickerInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  routePickerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  modalItemText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
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
  // Shipment Card
  shipmentCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  shipmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  routeContainer: {
    flex: 1,
  },
  routeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  priceText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  travelerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  travelerName: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  offersBadge: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  offersBadgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textInverse,
  },
  shipmentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginVertical: spacing.xs,
  },
  dateContainer: {},
  dateLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  dateText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  weightText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  statusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
});
