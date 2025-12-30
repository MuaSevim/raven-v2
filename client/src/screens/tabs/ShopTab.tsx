import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search,
  Apple,
  MapPin,
  PackageX,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

// Category card component
interface CategoryCardProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function CategoryCard({ label, icon, onPress }: CategoryCardProps) {
  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.categoryIcon}>{icon}</View>
      <Text style={styles.categoryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Featured card component
interface FeaturedCardProps {
  title: string;
  description: string;
  onPress: () => void;
}

function FeaturedCard({ title, description, onPress }: FeaturedCardProps) {
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.featuredTitle}>{title}</Text>
      <Text style={styles.featuredDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

// Nike-like icon (simplified swoosh)
function NikeIcon({ size, color }: { size: number; color: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.8, color }}>👟</Text>
    </View>
  );
}

export default function ShopTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { 
      id: 'apple', 
      label: 'Apple', 
      icon: <Apple size={32} color={colors.textPrimary} strokeWidth={1.5} /> 
    },
    { 
      id: 'nike', 
      label: 'Nike', 
      icon: <NikeIcon size={32} color={colors.textPrimary} />
    },
    { 
      id: 'local', 
      label: 'Local\nSpecialty', 
      icon: <MapPin size={32} color={colors.textPrimary} strokeWidth={1.5} /> 
    },
    { 
      id: 'luxury', 
      label: 'Luxury', 
      icon: <PackageX size={32} color={colors.textPrimary} strokeWidth={1.5} /> 
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Shop the World</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textTertiary} strokeWidth={1.5} />
          <TextInput
            style={styles.searchInput}
            placeholder="Which store do you want to shop from?"
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              label={category.label}
              icon={category.icon}
              onPress={() => {}}
            />
          ))}
        </View>

        {/* Featured Card */}
        <FeaturedCard
          title="iPhone from NYC to Istanbul"
          description="Get the latest tech delivered directly to you."
          onPress={() => {}}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    padding: 0,
  },
  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  categoryCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  categoryIcon: {
    marginBottom: spacing.md,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // Featured
  featuredCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  featuredTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  featuredDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
