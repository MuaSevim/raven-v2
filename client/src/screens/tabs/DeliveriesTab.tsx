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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Scale,
  Calendar,
  DollarSign,
  CheckCircle,
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
import { colors, typography, spacing, borderRadius } from "../../theme";



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

export default function DeliveriesTab() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeFilter, setRouteFilter] = useState({ origin: '', destination: '' });
  const [routeDraft, setRouteDraft] = useState({ origin: '', destination: '' });

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

  const handleAddDelivery = () => {
    navigation.navigate('SetRoute');
  };

  const handleShipmentPress = (shipmentId: string) => {
    navigation.navigate('ShipmentDetail', { shipmentId });
  };

  const handleRefresh = () => {
    fetchShipments(true);
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

  const normalizedOrigin = routeFilter.origin.trim().toLowerCase();
  const normalizedDestination = routeFilter.destination.trim().toLowerCase();

  const filteredShipments = [...shipments]
    .filter(s => s.status !== 'DELIVERED' && s.status !== 'CANCELLED' && s.status !== 'MATCHED')
    .filter(s => {
      if (!normalizedOrigin) return true;
      const originCity = s.originCity?.toLowerCase() || '';
      const originCountry = s.originCountry?.toLowerCase() || '';
      return originCity.includes(normalizedOrigin) || originCountry.includes(normalizedOrigin);
    })
    .filter(s => {
      if (!normalizedDestination) return true;
      const destCity = s.destCity?.toLowerCase() || '';
      const destCountry = s.destCountry?.toLowerCase() || '';
      return destCity.includes(normalizedDestination) || destCountry.includes(normalizedDestination);
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
        
        <TouchableOpacity
          style={styles.routeButton}
          onPress={() => {
            setRouteDraft(routeFilter);
            setShowRouteModal(true);
          }}
        >
          <Text style={styles.routeButtonLabel}>Route</Text>
          <Text style={styles.routeButtonValue}>
            {routeFilter.origin || routeFilter.destination
              ? `${routeFilter.origin || 'From'} → ${routeFilter.destination || 'To'}`
              : 'Choose origin and destination'}
          </Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
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
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.loadingText}>Loading shipments...</Text>
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
            <Text style={styles.routeModalTitle}>Select Route</Text>

            <Text style={styles.routeModalLabel}>From (origin)</Text>
            <TextInput
              style={styles.routeModalInput}
              placeholder="Country or city"
              placeholderTextColor={colors.textTertiary}
              value={routeDraft.origin}
              onChangeText={(value) => setRouteDraft((prev) => ({ ...prev, origin: value }))}
            />

            <Text style={styles.routeModalLabel}>To (destination)</Text>
            <TextInput
              style={styles.routeModalInput}
              placeholder="Country or city"
              placeholderTextColor={colors.textTertiary}
              value={routeDraft.destination}
              onChangeText={(value) => setRouteDraft((prev) => ({ ...prev, destination: value }))}
            />

            <View style={styles.routeModalActions}>
              <TouchableOpacity
                style={[styles.routeModalButton, styles.routeModalClear]}
                onPress={() => {
                  setRouteFilter({ origin: '', destination: '' });
                  setRouteDraft({ origin: '', destination: '' });
                  setShowRouteModal(false);
                }}
              >
                <Text style={styles.routeModalClearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.routeModalButton, styles.routeModalApply]}
                onPress={() => {
                  setRouteFilter({
                    origin: routeDraft.origin.trim(),
                    destination: routeDraft.destination.trim(),
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
  routeButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  routeButtonLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  routeButtonValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
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
  routeModalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  routeModalLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  routeModalInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
