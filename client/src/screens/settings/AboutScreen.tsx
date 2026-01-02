import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function AboutScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>About Raven</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Logo & Tagline */}
                <View style={styles.logoSection}>
                    <Text style={styles.logoText}>Raven</Text>
                    <Text style={styles.tagline}>Peer-to-Peer Global Delivery</Text>
                </View>

                {/* Mission */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Mission</Text>
                    <Text style={styles.body}>
                        Raven connects travelers with people who need items delivered around the world.
                        We believe in the power of community-driven logistics – making international
                        delivery faster, cheaper, and more personal than traditional shipping.
                    </Text>
                </View>

                {/* How It Works */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <Text style={styles.body}>
                        1. <Text style={styles.bold}>Post your package</Text> – Share where you need something delivered.{'\n\n'}
                        2. <Text style={styles.bold}>Match with a traveler</Text> – Verified travelers heading your route reach out.{'\n\n'}
                        3. <Text style={styles.bold}>Secure handshake</Text> – Payment is held safely until delivery is confirmed.{'\n\n'}
                        4. <Text style={styles.bold}>Receive your package</Text> – Get notified when your item arrives!
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>1,200+</Text>
                        <Text style={styles.statLabel}>Active Routes</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>5,000+</Text>
                        <Text style={styles.statLabel}>Deliveries</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>50+</Text>
                        <Text style={styles.statLabel}>Countries</Text>
                    </View>
                </View>

                {/* Legal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    <Text style={styles.bodySmall}>
                        Raven Technologies, Inc.{'\n'}
                        © 2024 All rights reserved.{'\n\n'}
                        Version 2.5.0
                    </Text>
                </View>
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
    },
    title: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },
    logoSection: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    logoText: {
        fontFamily: typography.fontFamily.bold,
        fontSize: 40,
        color: colors.textPrimary,
    },
    tagline: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    body: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.base,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    bodySmall: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
        lineHeight: 20,
    },
    bold: {
        fontFamily: typography.fontFamily.semiBold,
        color: colors.textPrimary,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.fontSize['2xl'],
        color: colors.textPrimary,
    },
    statLabel: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
