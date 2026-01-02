import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function PrivacyPolicyScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Privacy Policy</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.updated}>Last updated: January 1, 2025</Text>

                <View style={styles.section}>
                    <Text style={styles.heading}>1. Information We Collect</Text>
                    <Text style={styles.body}>
                        We collect information you provide directly, including:{'\n\n'}
                        • Account information (name, email, phone number){'\n'}
                        • Profile information (avatar, verification documents){'\n'}
                        • Shipment details (routes, package descriptions){'\n'}
                        • Payment information (processed securely via Stripe){'\n'}
                        • Communications (messages between users)
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>2. How We Use Your Information</Text>
                    <Text style={styles.body}>
                        We use your information to:{'\n\n'}
                        • Provide and improve our services{'\n'}
                        • Match travelers with shipment requests{'\n'}
                        • Process payments securely{'\n'}
                        • Communicate updates and notifications{'\n'}
                        • Ensure platform safety and prevent fraud
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>3. Information Sharing</Text>
                    <Text style={styles.body}>
                        We share your information only:{'\n\n'}
                        • With other users as needed for deliveries{'\n'}
                        • With service providers (payment processors, hosting){'\n'}
                        • When required by law{'\n'}
                        • With your explicit consent
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>4. Data Security</Text>
                    <Text style={styles.body}>
                        We implement industry-standard security measures including encryption,
                        secure data storage, and regular security audits. Payment information
                        is processed by PCI-compliant payment processors.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>5. Your Rights</Text>
                    <Text style={styles.body}>
                        You have the right to:{'\n\n'}
                        • Access your personal data{'\n'}
                        • Correct inaccurate information{'\n'}
                        • Delete your account and data{'\n'}
                        • Opt-out of marketing communications{'\n'}
                        • Export your data
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>6. Contact Us</Text>
                    <Text style={styles.body}>
                        For privacy-related inquiries, contact us at:{'\n\n'}
                        privacy@ravenapp.com
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
    updated: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textTertiary,
        marginBottom: spacing.xl,
    },
    section: {
        marginBottom: spacing.xl,
    },
    heading: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    body: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 22,
    },
});
