import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';

// =============================================================================
// FAQ DATA
// =============================================================================

const FAQ_DATA = [
    {
        question: 'How does Raven work?',
        answer: 'Raven connects people who need items delivered with travelers heading in that direction. Post your package, match with a verified traveler, and receive your item at the destination.',
    },
    {
        question: 'Is my payment secure?',
        answer: 'Yes! When you match with a traveler, your payment is held securely in escrow. The traveler only receives payment after you confirm delivery.',
    },
    {
        question: 'How do I become a verified traveler?',
        answer: 'Go to your Profile, tap "Verify Account", and upload a clear photo of your government-issued ID. Verification typically takes a few minutes.',
    },
    {
        question: 'What can I send through Raven?',
        answer: 'You can send legal items that comply with airline regulations. Prohibited items include hazardous materials, illegal goods, and items restricted by customs.',
    },
    {
        question: 'What if my package is lost or damaged?',
        answer: 'Report the issue immediately through the app. Our support team will investigate and work with both parties to find a resolution. Refunds may be issued depending on the circumstances.',
    },
    {
        question: 'How do I cancel a delivery?',
        answer: 'You can cancel before the package is handed to the traveler. Go to the delivery details and tap "Cancel". If already in transit, contact support.',
    },
    {
        question: 'Can I track my delivery?',
        answer: 'Yes! Once matched, you can message your traveler directly and track the delivery status in real-time through the app.',
    },
];

// =============================================================================
// FAQ ITEM COMPONENT
// =============================================================================

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onToggle: () => void;
    isLast: boolean;
}

function FAQItem({ question, answer, isOpen, onToggle, isLast }: FAQItemProps) {
    return (
        <TouchableOpacity
            style={[styles.faqItem, isLast && styles.faqItemLast]}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{question}</Text>
                {isOpen ? (
                    <ChevronUp size={20} color={colors.textPrimary} />
                ) : (
                    <ChevronDown size={20} color={colors.textTertiary} />
                )}
            </View>
            {isOpen && <Text style={styles.faqAnswer}>{answer}</Text>}
        </TouchableOpacity>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HelpSupportScreen() {
    const navigation = useNavigation();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@ravenapp.com?subject=Help%20Request');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Help & Support</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Contact Card */}
                <TouchableOpacity
                    style={styles.contactCard}
                    onPress={handleContactSupport}
                    activeOpacity={0.8}
                >
                    <Mail size={24} color={colors.textPrimary} />
                    <View style={styles.contactContent}>
                        <Text style={styles.contactTitle}>Contact Support</Text>
                        <Text style={styles.contactSubtitle}>support@ravenapp.com</Text>
                    </View>
                </TouchableOpacity>

                {/* FAQ Section */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                <View style={styles.faqContainer}>
                    {FAQ_DATA.map((item, index) => (
                        <FAQItem
                            key={index}
                            question={item.question}
                            answer={item.answer}
                            isOpen={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                            isLast={index === FAQ_DATA.length - 1}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

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

    // Contact Card
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    contactContent: {
        flex: 1,
    },
    contactTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    contactSubtitle: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },

    // FAQ
    sectionTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    faqContainer: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    faqItem: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    faqItemLast: {
        borderBottomWidth: 0,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontFamily: typography.fontFamily.medium,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        flex: 1,
        paddingRight: spacing.sm,
    },
    faqAnswer: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 22,
        marginTop: spacing.sm,
    },
});
