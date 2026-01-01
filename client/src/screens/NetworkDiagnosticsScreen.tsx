import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Wifi, Server, CheckCircle, XCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { API_URL, LOCAL_NETWORK_IP } from '../config';

interface TestResult {
    name: string;
    status: 'pending' | 'success' | 'error';
    message: string;
}

export default function NetworkDiagnosticsScreen() {
    const navigation = useNavigation();
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<TestResult[]>([]);

    const runDiagnostics = async () => {
        setTesting(true);
        const testResults: TestResult[] = [];

        // Test 1: Basic connectivity
        try {
            const response = await fetch(`${API_URL}/`, { method: 'GET' });
            testResults.push({
                name: 'Server Reachability',
                status: response.ok ? 'success' : 'error',
                message: response.ok
                    ? `Server is reachable at ${API_URL}`
                    : `Server returned status ${response.status}`,
            });
        } catch (error: any) {
            testResults.push({
                name: 'Server Reachability',
                status: 'error',
                message: `Cannot reach server: ${error.message}`,
            });
        }

        // Test 2: Auth endpoint
        try {
            const response = await fetch(`${API_URL}/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@example.com' }),
            });
            testResults.push({
                name: 'Auth Endpoint',
                status: response.status === 200 || response.status === 404 ? 'success' : 'error',
                message: response.ok
                    ? 'Auth endpoint is working'
                    : `Auth endpoint returned ${response.status}`,
            });
        } catch (error: any) {
            testResults.push({
                name: 'Auth Endpoint',
                status: 'error',
                message: `Auth endpoint failed: ${error.message}`,
            });
        }

        setResults(testResults);
        setTesting(false);

        const allPassed = testResults.every(r => r.status === 'success');
        if (allPassed) {
            Alert.alert('✅ All Tests Passed', 'Your network connection is working correctly!');
        } else {
            Alert.alert(
                '⚠️ Connection Issues Detected',
                'Please check the results and ensure:\n' +
                '1. Server is running (npm run start:dev)\n' +
                '2. Device is on the same WiFi network\n' +
                `3. IP address (${LOCAL_NETWORK_IP}) is correct`
            );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Network Diagnostics</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <Wifi size={24} color={colors.textPrimary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Server Configuration</Text>
                        <Text style={styles.infoText}>IP: {LOCAL_NETWORK_IP}</Text>
                        <Text style={styles.infoText}>URL: {API_URL}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.testButton, testing && styles.testButtonDisabled]}
                    onPress={runDiagnostics}
                    disabled={testing}
                >
                    <Server size={20} color={colors.textInverse} />
                    <Text style={styles.testButtonText}>
                        {testing ? 'Running Tests...' : 'Run Diagnostics'}
                    </Text>
                </TouchableOpacity>

                {results.length > 0 && (
                    <View style={styles.resultsSection}>
                        <Text style={styles.resultsTitle}>Test Results</Text>
                        {results.map((result, index) => (
                            <View key={index} style={styles.resultCard}>
                                <View style={styles.resultHeader}>
                                    {result.status === 'success' ? (
                                        <CheckCircle size={20} color="#22C55E" />
                                    ) : (
                                        <XCircle size={20} color="#EF4444" />
                                    )}
                                    <Text style={styles.resultName}>{result.name}</Text>
                                </View>
                                <Text style={styles.resultMessage}>{result.message}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.helpSection}>
                    <Text style={styles.helpTitle}>Troubleshooting Tips</Text>
                    <Text style={styles.helpText}>
                        1. Ensure the server is running: npm run start:dev{'\n'}
                        2. Check that your device is on the same WiFi network{'\n'}
                        3. Verify the IP address in config.ts matches your computer's IP{'\n'}
                        4. Disable any VPN or firewall that might block connections{'\n'}
                        5. Try restarting both the server and the Expo app
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
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.xs,
        marginRight: spacing.md,
    },
    title: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.xl,
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        gap: spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    infoText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.textPrimary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    testButtonDisabled: {
        opacity: 0.5,
    },
    testButtonText: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textInverse,
    },
    resultsSection: {
        marginBottom: spacing.xl,
    },
    resultsTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.lg,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    resultCard: {
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    resultName: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
    },
    resultMessage: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginLeft: 28,
    },
    helpSection: {
        backgroundColor: colors.backgroundSecondary,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    helpTitle: {
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.base,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    helpText: {
        fontFamily: typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 20,
    },
});
