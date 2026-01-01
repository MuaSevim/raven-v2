import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  BadgeCheck,
  Package,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '../../config';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Message {
  id: string;
  content: string;
  type: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  senderId: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  createdAt: string;
}

interface Conversation {
  id: string;
  status: string; // PENDING, ACTIVE, MATCHED
  user1: { id: string; firstName: string | null; lastName: string | null };
  user2: { id: string; firstName: string | null; lastName: string | null };
  otherUser: { id: string; firstName: string | null; lastName: string | null; isVerified: boolean };
  shipment: {
    id: string;
    originCity: string;
    destCity: string;
    price: number;
    currency: string;
    status: string;
    senderId: string;
  };
  messages: Message[];
  isSender: boolean;
  canMatch: boolean;
}

interface ChatParams {
  conversationId?: string;
  shipmentId: string;
  recipientId: string;
  recipientName?: string;
}

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
}

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const params = route.params as ChatParams;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matching, setMatching] = useState(false);

  const fetchOrCreateConversation = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      // If we have a conversationId, fetch it directly
      if (params.conversationId) {
        const response = await fetch(`${API_URL}/conversations/${params.conversationId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to load conversation');
        const data = await response.json();
        setConversation(data);
      } else {
        // Create or get conversation
        const response = await fetch(`${API_URL}/conversations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipmentId: params.shipmentId,
            recipientId: params.recipientId,
          }),
        });
        if (!response.ok) throw new Error('Failed to create conversation');
        const data = await response.json();
        setConversation(data);
      }
    } catch (err: any) {
      console.error('Error loading conversation:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrCreateConversation();
    }, [user, params.conversationId, params.shipmentId])
  );

  // Mark messages as read when entering the conversation
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || !conversation?.id) return;
      try {
        const token = await user.getIdToken();
        await fetch(`${API_URL}/conversations/${conversation.id}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };
    markAsRead();
  }, [user, conversation?.id]);

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (!conversation) return;

    const interval = setInterval(() => {
      fetchOrCreateConversation();
    }, 5000);

    return () => clearInterval(interval);
  }, [conversation?.id]);

  const handleSend = async () => {
    if (!message.trim() || !user || !conversation) return;

    setSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageText }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Refresh conversation
      await fetchOrCreateConversation();

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessage(messageText); // Restore message
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMatch = async () => {
    if (!user || !conversation) return;

    setMatching(true);

    try {
      const token = await user.getIdToken();

      // Check if user has payment method
      const paymentResponse = await fetch(`${API_URL}/payments/methods`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!paymentResponse.ok) throw new Error('Failed to check payment methods');

      const paymentMethods = await paymentResponse.json();

      if (paymentMethods.length === 0) {
        setShowMatchModal(false);
        setMatching(false);
        Alert.alert(
          'Payment Required',
          'Please add a payment method before matching with a courier.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Card', onPress: () => navigation.navigate('AddCard') },
          ]
        );
        return;
      }

      // Hold payment and match
      const holdResponse = await fetch(`${API_URL}/payments/hold`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: conversation.shipment.id,
          courierId: conversation.otherUser.id,
        }),
      });

      if (!holdResponse.ok) {
        const error = await holdResponse.json();
        throw new Error(error.message || 'Failed to process payment');
      }

      const result = await holdResponse.json();

      // Send system message
      await fetch(`${API_URL}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `🎉 Match confirmed! Payment of ${getCurrencySymbol(conversation.shipment.currency)}${conversation.shipment.price} has been held securely.`,
          type: 'MATCH_ACCEPTED',
        }),
      });

      setShowMatchModal(false);
      await fetchOrCreateConversation();

      Alert.alert('Success', result.message);
    } catch (err: any) {
      console.error('Error matching:', err);
      Alert.alert('Error', err.message);
    } finally {
      setMatching(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    const isSystem = item.type === 'SYSTEM' || item.type === 'MATCH_ACCEPTED';
    const isOffer = item.type === 'OFFER';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isMe && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {isOffer && (
            <Text style={[styles.offerLabel, isMe && styles.myOfferLabel]}>💼 Delivery Offer</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <View style={styles.statusTicks}>
                {item.status === 'SENT' && <Text style={styles.tickGrey}>✓</Text>}
                {item.status === 'DELIVERED' && <Text style={styles.tickGrey}>✓✓</Text>}
                {item.status === 'READ' && <Text style={styles.tickBlack}>✓✓</Text>}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const otherUserName = conversation
    ? `${conversation.otherUser.firstName || ''} ${conversation.otherUser.lastName || ''}`.trim() || 'User'
    : params.recipientName || 'User';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => conversation && navigation.navigate('ShipmentDetail', { shipmentId: conversation.shipment.id })}
        >
          <View style={styles.headerName}>
            <Text style={styles.recipientName} numberOfLines={1}>
              {otherUserName}
            </Text>
            {conversation?.otherUser?.isVerified && (
              <BadgeCheck size={16} color={colors.textPrimary} fill={colors.background} />
            )}
          </View>
          {conversation && (
            <View style={styles.routeRow}>
              <Text style={styles.routeText}>
                {conversation.shipment.originCity} → {conversation.shipment.destCity} • {getCurrencySymbol(conversation.shipment.currency)}{conversation.shipment.price}
              </Text>
              {conversation.shipment.status === 'MATCHED' && (
                <View style={styles.matchedBadge}>
                  <CheckCircle size={10} color="#22C55E" />
                  <Text style={styles.matchedText}>Matched</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Match Button - Only for sender when shipment is OPEN */}
        {conversation?.canMatch && (
          <TouchableOpacity
            style={styles.matchButton}
            onPress={() => setShowMatchModal(true)}
          >
            <CheckCircle size={16} color={colors.textInverse} />
            <Text style={styles.matchButtonText}>Match</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Price Banner for open shipments */}
      {conversation && conversation.shipment.status === 'OPEN' && (
        <TouchableOpacity
          style={styles.priceBanner}
          onPress={() => navigation.navigate('ShipmentDetail', { shipmentId: conversation.shipment.id })}
        >
          <Text style={styles.priceLabel}>Delivery reward:</Text>
          <Text style={styles.priceValue}>
            {getCurrencySymbol(conversation.shipment.currency)}{conversation.shipment.price}
          </Text>
        </TouchableOpacity>
      )}

      {/* Pending status banner for couriers */}
      {conversation && conversation.status === 'PENDING' && !conversation.isSender && (
        <View style={styles.pendingBanner}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.pendingText}>Waiting for owner's response...</Text>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={conversation?.messages || []}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>Start the conversation!</Text>
              <Text style={styles.emptySubtext}>
                Introduce yourself and discuss the delivery details.
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Send size={20} color={colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Match Confirmation Modal */}
      <Modal
        visible={showMatchModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMatchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <CheckCircle size={48} color="#22C55E" />
            </View>
            <Text style={styles.modalTitle}>Confirm Match</Text>
            <Text style={styles.modalDescription}>
              You're about to match with {otherUserName} for this delivery.
            </Text>

            <View style={styles.modalPriceBox}>
              <CreditCard size={20} color={colors.textSecondary} />
              <View>
                <Text style={styles.modalPriceLabel}>Payment will be held</Text>
                <Text style={styles.modalPriceValue}>
                  {getCurrencySymbol(conversation?.shipment.currency || 'USD')}
                  {conversation?.shipment.price || 0}
                </Text>
              </View>
            </View>

            <Text style={styles.modalNote}>
              The courier will receive payment once you confirm delivery.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowMatchModal(false)}
                disabled={matching}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleMatch}
                disabled={matching}
              >
                {matching ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Match</Text>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recipientName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  routeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#22C55E20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  matchedText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    color: '#22C55E',
  },
  matchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#22C55E',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  matchButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
  },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.sm,
  },
  priceLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF3C7',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pendingText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: '#92400E',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
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
    marginTop: spacing.xs,
  },
  messageContainer: {
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  myBubble: {
    backgroundColor: colors.textPrimary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  myMessageText: {
    color: colors.textInverse,
  },
  messageTime: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  systemMessageText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    width: '100%',
    marginBottom: spacing.md,
  },
  modalPriceLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  modalPriceValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  modalNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  // Message status ticks
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusTicks: {
    marginLeft: 4,
  },
  tickGrey: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  tickBlack: {
    fontSize: 10,
    color: colors.textPrimary,
  },
  // Offer message styling
  offerLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  myOfferLabel: {
    color: colors.textInverse,
    opacity: 0.8,
  },
});
