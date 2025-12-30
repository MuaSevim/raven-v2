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
import { API_URL } from "../../config";
import { colors, typography, spacing, borderRadius } from "../../theme";

interface Shipment {
  id: string;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  dateStart: string;
  dateEnd: string;
  price: number;
  currency: string;
  weight: number;
  weightUnit: string;
  packageType: string;
  content: string;
  status: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
  _count?: {
    offers: number;
  };
}

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
        {shipment._count && shipment._count.offers > 0 && (
          <View style={styles.offersBadge}>
            <Text style={styles.offersBadgeText}>{shipment._count.offers} offers</Text>
          </View>
        )}
      </View>

      {/* Bottom Row: Date Range and Weight */}
      <View style={styles.shipmentDetails}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Delivery window</Text>
          <Text style={styles.dateText}>
            {formatDate(shipment.dateStart)} - {formatDate(shipment.dateEnd)}
          </Text>
        </View>
        <View style={styles.weightContainer}>
          {getTypeIcon(shipment.packageType)}
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
    case 'IN_TRANSIT': return '#F59E0B';
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

  const fetchShipments = async (showRefresh = false) => {
    if (!user) return;
    
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/shipments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }
      
      const data = await response.json();
      setShipments(data);
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError(err.message || 'Failed to load shipments');
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

  // Filter shipments based on active filter
  const filteredShipments = [...shipments].sort((a, b) => {
    switch (activeFilter) {
      case 'weight':
        return b.weight - a.weight;
      case 'date':
        return new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime();
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddDelivery}>
          <Plus size={20} color={colors.textInverse} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionLabel}>Filter options</Text>
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
      <View style={styles.listHeader}>
        <Text style={styles.sectionLabel}>
          {shipments.length} available shipment{shipments.length !== 1 ? 's' : ''}
        </Text>
      </View>

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
});
