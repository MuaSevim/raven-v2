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
  Info,
  Check,
  CheckCheck,
  CheckCircle,
  CreditCard,
} from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../utils/api';
import { chatService, FirestoreMessage } from '../../services/chatService';
import type { ConversationDetailResponse } from '../../types/api';
import { colors, typography, spacing, borderRadius } from '../../theme';

// ─── Types ──────────────────────────────────────────────────────────────

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

// ─── Tracking Bar ───────────────────────────────────────────────────────

const STEPS = ['Offer', 'Meet up', 'Ongoing', 'Delivered'];

function getActiveStepIndex(status?: string): number {
  switch (status) {
    case 'OPEN':       return 0;
    case 'MATCHED':    return 1;
    case 'HANDED_OVER': return 1;
    case 'ON_WAY':     return 2;
    case 'DELIVERED':  return 3;
    default:           return 0;
  }
}

function TrackingBar({ status, onPress }: { status?: string; onPress?: () => void }) {
  const activeIndex = getActiveStepIndex(status);

  return (
    <TouchableOpacity
      style={styles.trackingContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && (
            <View
              style={[
                styles.trackingLine,
                i <= activeIndex && styles.trackingLineActive,
              ]}
            />
          )}
          <View style={styles.trackingStep}>
            <View
              style={[
                styles.trackingDot,
                i <= activeIndex && styles.trackingDotActive,
                i === activeIndex && styles.trackingDotCurrent,
              ]}
            />
            <Text
              style={[
                styles.trackingLabel,
                i <= activeIndex && styles.trackingLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </TouchableOpacity>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const params = route.params as ChatParams;

  // PostgreSQL metadata (conversation, shipment info, canMatch, etc.)
  const [conversation, setConversation] = useState<ConversationDetailResponse | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  // Firestore messages (real-time)
  const [messages, setMessages] = useState<FirestoreMessage[]>([]);
  const [messagesReady, setMessagesReady] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matching, setMatching] = useState(false);

  // ── Fetch conversation metadata from PostgreSQL ──
  const fetchConversationMeta = async () => {
    if (!user) return;
    try {
      if (params.conversationId) {
        const data = await api.conversations.getById(params.conversationId);
        setConversation(data);
      } else {
        const data = await api.conversations.create({
          shipmentId: params.shipmentId,
          recipientId: params.recipientId,
        });
        setConversation(data);
      }
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      console.error('Error loading conversation:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setMetaLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversationMeta();
    }, [user, params.conversationId, params.shipmentId])
  );

  // ── Subscribe to Firestore messages once we have a conversation ID ──
  useEffect(() => {
    const convoId = conversation?.id;
    if (!convoId) return;

    // Safety timeout: if Firestore hasn't responded in 8s, show what we have
    const fallbackTimer = setTimeout(() => {
      if (!messagesReady) {
        // Seed from PG messages if Firestore is empty / unavailable
        const pgMessages = conversation?.messages || [];
        if (pgMessages.length > 0) {
          const seeded: FirestoreMessage[] = pgMessages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            text: m.content,
            type: (m.type as any) || 'TEXT',
            mediaUrl: null,
            location: null,
            status: (m.status as 'SENT' | 'READ') || 'SENT',
            createdAt: new Date(m.createdAt),
          }));
          setMessages(seeded);
        }
        setMessagesReady(true);
      }
    }, 8000);

    const unsubscribe = chatService.subscribeToMessages(
      convoId,
      (msgs) => {
        clearTimeout(fallbackTimer);
        if (msgs.length === 0 && !messagesReady) {
          // Firestore empty — seed from PG messages (e.g. initial offer message)
          const pgMessages = conversation?.messages || [];
          if (pgMessages.length > 0) {
            const seeded: FirestoreMessage[] = pgMessages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              text: m.content,
              type: (m.type as any) || 'TEXT',
              mediaUrl: null,
              location: null,
              status: (m.status as 'SENT' | 'READ') || 'SENT',
              createdAt: new Date(m.createdAt),
            }));
            setMessages(seeded);
          }
        } else {
          setMessages(msgs);
        }
        setFirestoreError(null);
        setMessagesReady(true);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        clearTimeout(fallbackTimer);
        setFirestoreError('Real-time chat unavailable');
        // Fall back to PG messages so chat is still usable
        const pgMessages = conversation?.messages || [];
        const seeded: FirestoreMessage[] = pgMessages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          text: m.content,
          type: (m.type as any) || 'TEXT',
          mediaUrl: null,
          location: null,
          status: (m.status as 'SENT' | 'READ') || 'SENT',
          createdAt: new Date(m.createdAt),
        }));
        setMessages(seeded);
        setMessagesReady(true);
      }
    );

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [conversation?.id]);

  // ── Mark as read ──
  useEffect(() => {
    if (!user || !conversation?.id) return;
    api.conversations.markAsRead(conversation.id).catch(() => {});
  }, [user, conversation?.id]);

  // ── Send message via Firestore ──
  const handleSend = async () => {
    if (!messageInput.trim() || !user || !conversation) return;

    setSending(true);
    const text = messageInput.trim();
    setMessageInput('');

    try {
      await chatService.sendMessage(conversation.id, {
        senderId: user.uid,
        text,
        type: 'TEXT',
      });

      // Notify PG of lastMessage only (for InboxScreen preview) — fire and forget
      api.conversations.sendMessage(conversation.id, text).catch(() => {});

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err: Error | unknown) {
      console.error('Error sending message:', err);
      setMessageInput(text); // restore input on failure
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ── Match handler (unchanged — PG + payment flow) ──
  const handleMatch = async () => {
    if (!user || !conversation) return;
    setMatching(true);

    try {
      const paymentMethodsResponse = await api.payments.getMethods();
      const paymentMethods = paymentMethodsResponse.data || [];

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

      await api.payments.holdPayment(
        conversation.shipment?.id || '',
        conversation.otherUser?.id || ''
      );

      // Send system message to Firestore
      await chatService.sendMessage(conversation.id, {
        senderId: 'system',
        text: `🎉 Match confirmed! Payment of ${getCurrencySymbol(conversation.shipment?.currency || 'USD')}${conversation.shipment?.price || 0} has been held securely.`,
        type: 'SYSTEM',
      });

      // Also update PG
      await api.conversations.sendMessage(
        conversation.id,
        `🎉 Match confirmed! Payment held securely.`
      );

      setShowMatchModal(false);
      await fetchConversationMeta();
      Alert.alert('Success', 'Match confirmed! Payment has been held securely.');
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process match';
      console.error('Error matching:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setMatching(false);
    }
  };

  // ── Render helpers ──
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: FirestoreMessage }) => {
    const isMe = item.senderId === user?.uid;
    const isSystem = item.type === 'SYSTEM';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isMe && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {item.type === 'OFFER' && (
            <Text style={[styles.offerLabel, isMe && styles.myOfferLabel]}>
              📦 Offer Message
            </Text>
          )}
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <View style={styles.statusTicks}>
                {item.status === 'SENT' && <Check size={14} color={colors.textTertiary} />}
                {item.status === 'READ' && <CheckCheck size={14} color="#3B82F6" />}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const otherUserName = conversation?.otherUser
    ? `${conversation.otherUser.firstName || ''} ${conversation.otherUser.lastName || ''}`.trim() || 'User'
    : params.recipientName || 'User';

  const shipmentStatus = conversation?.shipment?.status;

  // ── Loading state ──
  if (metaLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'column', alignItems: 'stretch', gap: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: conversation?.canMatch ? spacing.sm : 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerInfo}
              onPress={() => conversation && navigation.navigate('PublicProfile', { userId: conversation.otherUser?.id })}
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
                <Text style={styles.routeText}>
                  {conversation.shipment?.originCity} → {conversation.shipment?.destCity}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              if (!conversation) return;
              if (conversation.shipment?.status === 'OPEN') {
                navigation.navigate('ShipmentDetail', { shipmentId: conversation.shipment?.id });
              } else {
                navigation.navigate('ActivityDetail', { shipmentId: conversation.shipment?.id });
              }
            }}
          >
            <Info size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Match Button - Only for sender when shipment is OPEN */}
        {conversation?.canMatch && (
          <TouchableOpacity
            style={[styles.matchButton, { justifyContent: 'center', width: '100%' }]}
            onPress={() => setShowMatchModal(true)}
          >
            <CheckCircle size={16} color={colors.textInverse} />
            <Text style={styles.matchButtonText}>Match</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tracking Bar */}
      {shipmentStatus && shipmentStatus !== 'OPEN' && shipmentStatus !== 'CANCELLED' && (
        <TrackingBar
          status={shipmentStatus}
          onPress={() => {
            if (conversation?.shipment?.id) {
              navigation.navigate('ActivityDetail', { shipmentId: conversation.shipment.id });
            }
          }}
        />
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {!messagesReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
          </View>
        ) : (
          <>
            {firestoreError && (
              <View style={styles.offlineBanner}>
                <Text style={styles.offlineBannerText}>
                  ⚠️ Real-time chat unavailable — showing cached messages
                </Text>
              </View>
            )}
            <FlatList
              ref={flatListRef}
              data={messages}
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
          </>
        )}

        {/* Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!messageInput.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!messageInput.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Send size={20} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          </View>
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
                  {getCurrencySymbol(conversation?.shipment?.currency || 'USD')}
                  {conversation?.shipment?.price || 0}
                </Text>
              </View>
            </View>

            <Text style={styles.modalNote}>
              The passenger will receive payment once you confirm delivery.
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
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
  routeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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
  infoButton: {
    padding: spacing.sm,
  },

  // ── Tracking Bar ──
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trackingStep: {
    alignItems: 'center',
    gap: 4,
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  trackingDotActive: {
    backgroundColor: '#22C55E',
  },
  trackingDotCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#22C55E',
    backgroundColor: colors.background,
  },
  trackingLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16, // align with dots, not labels
  },
  trackingLineActive: {
    backgroundColor: '#22C55E',
  },
  trackingLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    color: colors.textTertiary,
  },
  trackingLabelActive: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },

  // ── Messages ──
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineBannerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: '#92400E',
    textAlign: 'center',
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
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  messageTime: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  statusTicks: {
    marginLeft: 4,
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

  // ── Input ──
  inputWrapper: {
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : 0,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
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
    paddingVertical: spacing.md,
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

  // ── Modal ──
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
});
