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
  Info,
  Check,
  CheckCheck,
  CheckCircle,
  CreditCard,
  Package,
  Truck,
  Clock,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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

const STEPS = ['Offer', 'Meet up', 'Ongoing', 'Successful'];

function getActiveStepIndex(status?: string): number {
  switch (status) {
    case 'OPEN':        return 0;
    case 'MATCHED':     return 1;
    case 'HANDED_OVER': return 1;
    case 'ON_WAY':      return 2;
    case 'DELIVERED':   return 3;
    default:            return 0;
  }
}

function TrackingBar({ status }: { status?: string }) {
  const activeIndex = getActiveStepIndex(status);

  return (
    <View style={styles.trackingContainer}>
      {STEPS.map((label, i) => {
        const isComplete = i < activeIndex;
        const isActive = i === activeIndex;
        const isReached = isComplete || isActive;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <View style={[styles.trackingLine, isComplete && styles.trackingLineActive]} />
            )}
            <View style={styles.trackingStep}>
              <View style={[
                styles.trackingDot,
                isReached && styles.trackingDotActive,
              ]}>
                {isComplete && <Check size={7} color={colors.textInverse} strokeWidth={3} />}
              </View>
              <Text style={[
                styles.trackingLabel,
                isReached && styles.trackingLabelActive,
              ]}>{label}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Action Card ────────────────────────────────────────────────────────

interface ActionCardProps {
  conversation: ConversationDetailResponse;
  userId: string;
  onAcceptOffer: (offerId: string) => void;
  onConfirmHandover: () => void;
  onConfirmDelivery: () => void;
  loading: boolean;
}

function ActionCard({ conversation, userId, onAcceptOffer, onConfirmHandover, onConfirmDelivery, loading }: ActionCardProps) {
  const shipment = conversation.shipment as any;
  if (!shipment) return null;

  const status = shipment.status;
  const isSender = shipment.senderId === userId;
  const currency = getCurrencySymbol(shipment.currency || 'USD');
  const price = shipment.price || 0;

  // State 1: OPEN — Show offer info + Accept button for sender
  if (status === 'OPEN') {
    const pendingOffer = shipment.offers?.find((o: any) => o.status === 'PENDING');
    if (!pendingOffer) return null;

    const courierName = pendingOffer.courier
      ? `${pendingOffer.courier.firstName || ''} ${pendingOffer.courier.lastName || ''}`.trim()
      : 'Courier';

    if (isSender) {
      return (
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <Package size={18} color={colors.textPrimary} />
            <Text style={styles.actionCardTitle}>Delivery Offer</Text>
            <Text style={styles.actionCardPrice}>{currency}{price}</Text>
          </View>
          <Text style={styles.actionCardDesc}>
            {courierName} proposes to transport your item.
          </Text>
          <View style={styles.actionCardButtons}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => onAcceptOffer(pendingOffer.id)}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnPrimaryText}>Accept</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => {/* TODO: Counter offer flow */}}
            >
              <Text style={styles.actionBtnOutlineText}>Counter Offer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // Courier sees "Awaiting Response"
    return (
      <View style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <Clock size={18} color={colors.textSecondary} />
          <Text style={styles.actionCardTitle}>Offer Sent</Text>
          <Text style={styles.actionCardPrice}>{currency}{price}</Text>
        </View>
        <Text style={styles.actionCardDesc}>Waiting for the sender to review your offer.</Text>
      </View>
    );
  }

  // State 2: MATCHED — Confirm Handover
  if (status === 'MATCHED' || status === 'HANDED_OVER') {
    const myConfirmed = isSender ? shipment.senderConfirmedHandover : shipment.courierConfirmedHandover;
    const otherConfirmed = isSender ? shipment.courierConfirmedHandover : shipment.senderConfirmedHandover;

    return (
      <View style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <CheckCircle size={18} color={colors.textPrimary} />
          <Text style={styles.actionCardTitle}>Meet Up Phase</Text>
        </View>
        <Text style={styles.actionCardDesc}>
          Meet with your {isSender ? 'courier' : 'sender'} to hand over the package.
        </Text>
        <View style={styles.actionCardButtons}>
          {myConfirmed ? (
            <View style={styles.actionBtnDisabled}>
              <Clock size={14} color={colors.textTertiary} />
              <Text style={styles.actionBtnDisabledText}>
                {otherConfirmed ? 'Both confirmed!' : 'Waiting for other party...'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={onConfirmHandover}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnPrimaryText}>Confirm Handover</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // State 3: ON_WAY — Confirm Delivery
  if (status === 'ON_WAY') {
    const myConfirmed = isSender ? shipment.senderConfirmedDelivery : shipment.courierConfirmedDelivery;
    const otherConfirmed = isSender ? shipment.courierConfirmedDelivery : shipment.senderConfirmedDelivery;

    return (
      <View style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <Truck size={18} color={colors.textPrimary} />
          <Text style={styles.actionCardTitle}>In Transit</Text>
        </View>
        <Text style={styles.actionCardDesc}>
          Package is on the way. Confirm when delivery is complete.
        </Text>
        <View style={styles.actionCardButtons}>
          {myConfirmed ? (
            <View style={styles.actionBtnDisabled}>
              <Clock size={14} color={colors.textTertiary} />
              <Text style={styles.actionBtnDisabledText}>
                {otherConfirmed ? 'Delivery confirmed!' : 'Waiting for other party...'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={onConfirmDelivery}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnPrimaryText}>Confirm Delivery</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // State 4: DELIVERED — Complete
  if (status === 'DELIVERED') {
    return (
      <View style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <CheckCircle size={18} color={colors.textPrimary} />
          <Text style={styles.actionCardTitle}>Delivery Complete</Text>
        </View>
        <Text style={styles.actionCardDesc}>Package has been delivered successfully! 🎉</Text>
      </View>
    );
  }

  return null;
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
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch conversation metadata from PostgreSQL (once on mount only) ──
  const fetchConversationMeta = useCallback(async () => {
    if (!user) return;
    try {
      let data;
      if (params.conversationId) {
        data = await api.conversations.getById(params.conversationId);
      } else {
        // Try to find existing conversation first (avoid unnecessary creation)
        try {
          const all = await api.conversations.getAll();
          const existing = (all.data || []).find(
            (c: any) => c.shipmentId === params.shipmentId || c.shipment?.id === params.shipmentId
          );
          if (existing) {
            data = await api.conversations.getById(existing.id);
          }
        } catch {}

        if (!data) {
          data = await api.conversations.create({
            shipmentId: params.shipmentId,
            recipientId: params.recipientId,
          });
        }
      }
      setConversation(data);

      // Immediately seed messages from PG so chat isn't blank while Firestore connects
      const msgs = data?.messages;
      if (Array.isArray(msgs) && msgs.length > 0) {
        const pgMessages: FirestoreMessage[] = msgs.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          text: m.content,
          type: (m.type as any) || 'TEXT',
          mediaUrl: null,
          location: null,
          status: (m.status as 'SENT' | 'READ') || 'SENT',
          createdAt: new Date(m.createdAt),
        }));
        setMessages(pgMessages);
        setMessagesReady(true);
      }
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      console.error('Error loading conversation:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setMetaLoading(false);
    }
  }, [user, params.conversationId, params.shipmentId, params.recipientId]);

  // Run once on mount — NOT useFocusEffect (prevents re-fetching on every focus)
  useEffect(() => {
    fetchConversationMeta();
  }, []);

  // ── Subscribe to Firestore messages once we have a conversation ID ──
  const messagesReadyRef = useRef(false);

  useEffect(() => {
    const convoId = conversation?.id;
    if (!convoId) return;

    // Safety timeout: if Firestore hasn't responded in 3s, show what we have
    const fallbackTimer = setTimeout(() => {
      if (!messagesReadyRef.current) {
        messagesReadyRef.current = true;
        setMessagesReady(true);
      }
    }, 3000);

    const unsubscribe = chatService.subscribeToMessages(
      convoId,
      (firestoreMsgs) => {
        clearTimeout(fallbackTimer);

        if (firestoreMsgs.length === 0 && !messagesReadyRef.current) {
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
          // MERGE: keep optimistic messages that aren't yet in the Firestore snapshot
          setMessages(prev => {
            const optimistic = prev.filter(
              m => m.id.startsWith('optimistic_') &&
                !firestoreMsgs.some(fm => fm.text === m.text && fm.senderId === m.senderId)
            );
            return [...firestoreMsgs, ...optimistic];
          });
        }
        setFirestoreError(null);
        messagesReadyRef.current = true;
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
        messagesReadyRef.current = true;
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

  // ── Send message via Firestore (optimistic UI) ──
  const handleSend = async () => {
    if (!messageInput.trim() || !user || !conversation) return;

    const text = messageInput.trim();
    setMessageInput('');

    // Optimistic: immediately append to local state
    const optimisticMsg: FirestoreMessage = {
      id: `optimistic_${Date.now()}`,
      senderId: user.uid,
      text,
      type: 'TEXT',
      mediaUrl: null,
      location: null,
      status: 'SENT',
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await chatService.sendMessage(conversation.id, {
        senderId: user.uid,
        text,
        type: 'TEXT',
      });
      // Notify PG of lastMessage only (for InboxScreen preview) — fire and forget
      api.conversations.sendMessage(conversation.id, text).catch(() => {});
    } catch (err: Error | unknown) {
      console.error('Error sending message:', err);
      setMessageInput(text); // restore input on failure
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // ── Accept Offer ──
  const handleAcceptOffer = async (offerId: string) => {
    if (!conversation?.shipment?.id) return;
    setActionLoading(true);
    try {
      await api.shipments.acceptOffer(conversation.shipment.id, offerId);
      await chatService.sendMessage(conversation.id, {
        senderId: 'system',
        text: '✅ Offer accepted! You are now matched.',
        type: 'SYSTEM',
      });
      await fetchConversationMeta();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to accept offer');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Confirm Handover ──
  const handleConfirmHandover = async () => {
    if (!conversation?.shipment?.id) return;
    setActionLoading(true);
    try {
      const result = await api.shipments.confirmHandover(conversation.shipment.id);
      await chatService.sendMessage(conversation.id, {
        senderId: 'system',
        text: result.message,
        type: 'SYSTEM',
      });
      await fetchConversationMeta();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to confirm handover');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Confirm Delivery ──
  const handleConfirmDelivery = async () => {
    if (!conversation?.shipment?.id) return;
    setActionLoading(true);
    try {
      const result = await api.shipments.confirmDelivery(conversation.shipment.id);
      await chatService.sendMessage(conversation.id, {
        senderId: 'system',
        text: result.message,
        type: 'SYSTEM',
      });
      await fetchConversationMeta();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading(false);
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

  // ── Loading state — subtle skeleton instead of blocking spinner ──
  if (metaLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { justifyContent: 'center' }]}>
          <View style={{ width: 120, height: 14, backgroundColor: colors.backgroundSecondary, borderRadius: 7 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.textTertiary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>RAVEN</Text>
          <TouchableOpacity
            onPress={() => conversation && navigation.navigate('PublicProfile', { userId: conversation.otherUser?.id })}
          >
            <Text style={styles.headerSubtitle}>{otherUserName}</Text>
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

      {/* Tracking Bar — always visible */}
      {shipmentStatus && shipmentStatus !== 'CANCELLED' && (
        <>
          <TrackingBar status={shipmentStatus} />
          {/* Current Offer Pill */}
          {conversation?.shipment?.price != null && (
            <View style={styles.offerPillContainer}>
              <View style={styles.offerPill}>
                <Text style={styles.offerPillText}>
                  Current Offer: {getCurrencySymbol(conversation.shipment?.currency || 'USD')}{conversation.shipment.price}
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Action Card — contextual based on shipment status */}
      {conversation && user && (
        <ActionCard
          conversation={conversation}
          userId={user.uid}
          onAcceptOffer={handleAcceptOffer}
          onConfirmHandover={handleConfirmHandover}
          onConfirmDelivery={handleConfirmDelivery}
          loading={actionLoading}
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
            <ActivityIndicator size="small" color={colors.textTertiary} />
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
              data={[...messages].reverse()}
              inverted
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
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
              <CheckCircle size={48} color={colors.textPrimary} />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  infoButton: {
    padding: spacing.xs,
    width: 40,
    alignItems: 'flex-end' as const,
  },

  // ── Tracking Bar ──
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
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
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  trackingDotActive: {
    backgroundColor: colors.textPrimary,
  },
  trackingLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  trackingLineActive: {
    backgroundColor: colors.textPrimary,
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

  // ── Offer Pill ──
  offerPillContainer: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  offerPill: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  offerPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs,
    color: colors.textInverse,
  },

  // ── Action Card ──
  actionCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  actionCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionCardTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  actionCardPrice: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  actionCardDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  actionCardButtons: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionBtnPrimaryText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
  actionBtnDisabled: {
    flex: 1,
    flexDirection: 'row' as const,
    gap: spacing.xs,
    backgroundColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionBtnDisabledText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.background,
  },
  actionBtnOutlineText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
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
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
  },
});
