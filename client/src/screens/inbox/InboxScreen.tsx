import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  MessageCircle,
  ChevronLeft,
  Package,
  CheckCircle,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Conversation {
  id: string;
  status: string; // PENDING, ACTIVE, MATCHED
  user1Id: string; // Owner of the shipment
  otherUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
  shipment: {
    id: string;
    originCity: string;
    destCity: string;
    price: number;
    currency: string;
    status: string;
    senderId?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    sender: { id: string };
  } | null;
  unreadCount: number;
  updatedAt: string;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function ConversationItem({
  conversation,
  currentUserId,
  onPress
}: {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}) {
  const otherName = `${conversation.otherUser.firstName || ''} ${conversation.otherUser.lastName || ''}`.trim() || 'Unknown';
  const isUnread = conversation.unreadCount > 0;
  const lastMessagePreview = conversation.lastMessage?.content || 'Start a conversation';
  const isMyMessage = conversation.lastMessage?.sender.id === currentUserId;

  // Determine if current user is the shipment owner
  const isOwner = conversation.user1Id === currentUserId;

  // Get status indicator
  const getStatusInfo = () => {
    if (conversation.shipment.status === 'MATCHED') {
      return { label: 'Matched', color: '#22C55E' };
    }
    if (conversation.status === 'PENDING') {
      return isOwner
        ? { label: 'New Offer', color: '#F59E0B' }
        : { label: 'Pending', color: '#F59E0B' };
    }
    if (conversation.status === 'ACTIVE') {
      return { label: 'Active', color: '#3B82F6' };
    }
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      style={[styles.conversationItem, isUnread && styles.conversationItemUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {otherName.charAt(0).toUpperCase()}
          </Text>
        </View>
        {statusInfo && (
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        )}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={[styles.userName, isUnread && styles.userNameUnread]} numberOfLines={1}>
              {otherName}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: isOwner ? '#EFF6FF' : '#F0FDF4' }]}>
              <Text style={[styles.roleText, { color: isOwner ? '#3B82F6' : '#22C55E' }]}>
                {isOwner ? 'Your Shipment' : 'Your Offer'}
              </Text>
            </View>
          </View>
          <Text style={styles.timeText}>
            {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
          </Text>
        </View>

        <View style={styles.routeBadge}>
          <Package size={10} color={colors.textTertiary} />
          <Text style={styles.routeText}>
            {conversation.shipment.originCity} → {conversation.shipment.destCity}
          </Text>
          {statusInfo && (
            <View style={[styles.statusBadgeSmall, { backgroundColor: statusInfo.color + '20' }]}>
              <Text style={[styles.statusTextSmall, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.messageRow}>
          <View style={styles.messagePreviewContainer}>
            {isMyMessage && (
              <Text style={styles.messageTickPreview}>✓ </Text>
            )}
            <Text
              style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {isMyMessage ? 'You: ' : ''}{lastMessagePreview}
            </Text>
          </View>
          {isUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function InboxScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async (showRefresh = false) => {
    if (!user) return;

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      setConversations(data);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [user])
  );

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      shipmentId: conversation.shipment.id,
      recipientId: conversation.otherUser.id,
      recipientName: `${conversation.otherUser.firstName || ''} ${conversation.otherUser.lastName || ''}`.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <MessageCircle size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <MessageCircle size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Start a conversation by contacting a sender about their shipment
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              currentUserId={user?.uid || ''}
              onPress={() => handleConversationPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchConversations(true)}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
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
  emptyTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  conversationItemUnread: {
    backgroundColor: colors.backgroundSecondary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xl,
    color: colors.textInverse,
  },
  matchedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 2,
  },
  conversationContent: {
    flex: 1,
    gap: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  userNameUnread: {
    fontFamily: typography.fontFamily.semiBold,
  },
  timeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  lastMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  lastMessageUnread: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.textInverse,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 9,
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  statusTextSmall: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 9,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageTickPreview: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});
