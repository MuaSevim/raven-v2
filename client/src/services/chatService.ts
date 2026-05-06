/**
 * Firestore-based real-time chat service.
 *
 * PostgreSQL (via NestJS) still owns the conversation *metadata*
 * (who is talking to whom, about which shipment, canMatch, etc.).
 *
 * Firestore owns the high-velocity *message* data and provides
 * native WebSocket listeners + offline persistence out of the box.
 *
 * Schema:
 *   chats/{conversationId}/messages/{messageId}
 *     senderId, text, type, mediaUrl, location, status, createdAt
 */

import { firestore } from './firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ─── Types ───────────────────────────────────────────────────────────
export type MessageType = 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM' | 'OFFER';

export interface FirestoreMessage {
  id: string;
  senderId: string;
  text: string;
  type: MessageType;
  mediaUrl?: string | null;
  location?: { lat: number; lng: number } | null;
  status: 'SENT' | 'READ';
  createdAt: Date;
}

export interface SendMessagePayload {
  senderId: string;
  text: string;
  type?: MessageType;
  mediaUrl?: string | null;
  location?: { lat: number; lng: number } | null;
}

// ─── Service ─────────────────────────────────────────────────────────
export const chatService = {
  /**
   * Subscribe to real-time message updates for a conversation.
   * Returns an `unsubscribe` function — call it when the screen unmounts.
   */
  subscribeToMessages: (
    conversationId: string,
    callback: (messages: FirestoreMessage[]) => void,
    onError?: (error: Error) => void,
  ) => {
    const messagesRef = collection(
      firestore,
      'chats',
      conversationId,
      'messages',
    );
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: FirestoreMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId ?? '',
            text: data.text ?? '',
            type: (data.type as MessageType) ?? 'TEXT',
            mediaUrl: data.mediaUrl ?? null,
            location: data.location ?? null,
            status: data.status ?? 'SENT',
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt ?? Date.now()),
          };
        });
        callback(messages);
      },
      (error) => {
        if (onError) onError(error);
      },
    );

    return unsubscribe;
  },

  /**
   * Send a message into a conversation's Firestore sub-collection.
   */
  sendMessage: async (
    conversationId: string,
    payload: SendMessagePayload,
  ): Promise<void> => {
    const messagesRef = collection(
      firestore,
      'chats',
      conversationId,
      'messages',
    );
    await addDoc(messagesRef, {
      senderId: payload.senderId,
      text: payload.text,
      type: payload.type ?? 'TEXT',
      mediaUrl: payload.mediaUrl ?? null,
      location: payload.location ?? null,
      status: 'SENT',
      createdAt: serverTimestamp(),
    });
  },
};
