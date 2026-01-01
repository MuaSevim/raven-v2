import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { colors } from '../../theme';

interface MessageStatusProps {
    status: 'SENT' | 'DELIVERED' | 'READ';
    isOwnMessage: boolean;
}

/**
 * Displays message delivery status with tick indicators:
 * - SENT: One grey tick (message created on server)
 * - DELIVERED: Two grey ticks (recipient notified)
 * - READ: Two black ticks (recipient opened the chat)
 */
export default function MessageStatus({ status, isOwnMessage }: MessageStatusProps) {
    // Only show status for own messages
    if (!isOwnMessage) return null;

    if (status === 'SENT') {
        return (
            <View style={styles.container}>
                <Check size={12} color={colors.textTertiary} />
            </View>
        );
    }

    if (status === 'DELIVERED') {
        return (
            <View style={styles.container}>
                <CheckCheck size={12} color={colors.textTertiary} />
            </View>
        );
    }

    if (status === 'READ') {
        return (
            <View style={styles.container}>
                <CheckCheck size={12} color={colors.textPrimary} />
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        marginLeft: 4,
    },
});
