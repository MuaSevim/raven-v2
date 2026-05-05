/**
 * Centralized API client with typed methods and proper error handling
 * All API calls must go through this wrapper for consistency
 */

import { API_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';
import { auth } from '../services/firebaseConfig';
import type {
  User,
  AuthResponse,
  AuthMeResponse,
  CheckEmailResponse,
  Shipment,
  ShipmentOffer,
  ShipmentsResponse,
  ShipmentOffersResponse,
  Conversation,
  ConversationsResponse,
  ConversationDetailResponse,
  UnreadConversationsResponse,
  MessagesResponse,
  PaymentMethod,
  PaymentTransaction,
  PaymentMethodsResponse,
  TransactionsResponse,
  PaymentHoldResponse,
  PaymentReleaseResponse,
  PaymentRefundResponse,
  Travel,
  TravelsResponse,
  UserProfile,
  UserProfileResponse,
  ApiError,
} from '../types/api';

const DEFAULT_TIMEOUT = 30000;

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch with timeout and better error handling
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: Error | unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }

    const message = error instanceof Error
      ? error.message
      : String((error as Record<string, unknown>)?.message || '');
    if (message === 'Network request failed') {
      throw new Error(
        `Cannot connect to server at ${API_URL}. Please ensure:\n` +
        '1. The server is running if using a local URL\n' +
        '2. The API_URL in config.ts points to the correct environment'
      );
    }

    throw error;
  }
}

/**
 * Get authorization header with Firebase token
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { user } = useAuthStore.getState();
    const activeUser = user || auth.currentUser;
    if (activeUser) {
      const token = await activeUser.getIdToken();
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  } catch {
    // If token is unavailable, return empty headers
  }
  return {};
}

/**
 * Parse JSON response with error handling
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = {
        message: text || `HTTP ${response.status}: ${response.statusText}`,
        code: `HTTP_${response.status}`,
      };
    }
    throw errorData;
  }

  if (!text || text === 'null') {
    return null as unknown as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

/**
 * Base API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const authHeader = await getAuthHeader();
  const url = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';

  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options.headers || {}),
      },
    });

    return parseResponse<T>(response);
  } catch (error: Error | ApiError | unknown) {
    const err = error as ApiError & { statusCode?: number; path?: string };
    console.error('API request failed', {
      method,
      endpoint,
      message: err?.message || 'Unknown error',
      code: err?.code,
      statusCode: err?.statusCode,
      path: err?.path,
    });
    throw error;
  }
}

/**
 * API Client with typed methods
 */
const normalizeShipmentList = (
  response: ShipmentsResponse | Shipment[]
): ShipmentsResponse => (Array.isArray(response) ? { data: response } : response);

export const api = {
  // === AUTH ENDPOINTS ===
  auth: {
    signIn: (email: string, password: string) =>
      apiRequest<AuthResponse>('/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    signUp: (data: Record<string, unknown>) =>
      apiRequest<AuthResponse>('/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () =>
      apiRequest<AuthMeResponse>('/auth/me', { method: 'GET' }),

    updateProfile: (data: Record<string, unknown>) =>
      apiRequest<User>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updatePassword: (currentPassword: string, newPassword: string) =>
      apiRequest<{ message: string }>('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),

    checkEmail: (email: string) =>
      apiRequest<CheckEmailResponse>(`/auth/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
      }),
  },

  // === SHIPMENT ENDPOINTS ===
  shipments: {
    create: (data: Record<string, unknown>) =>
      apiRequest<Shipment>('/shipments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getById: (id: string) =>
      apiRequest<Shipment>(`/shipments/${id}`, { method: 'GET' }),

    getMyShipments: () =>
      apiRequest<ShipmentsResponse | Shipment[]>('/shipments/my/sent', {
        method: 'GET',
      }).then(normalizeShipmentList),

    getMyDeliveries: () =>
      apiRequest<ShipmentsResponse | Shipment[]>('/shipments/my/delivering', {
        method: 'GET',
      }).then(normalizeShipmentList),

    getAvailableShipments: () =>
      apiRequest<ShipmentsResponse | Shipment[]>('/shipments', {
        method: 'GET',
      }).then(normalizeShipmentList),

    getOffers: (shipmentId: string) =>
      apiRequest<ShipmentOffersResponse>(`/shipments/${shipmentId}/offers`, {
        method: 'GET',
      }),

    getMyOffer: (shipmentId: string) =>
      apiRequest<ShipmentOffer>(`/shipments/${shipmentId}/my-offer`, {
        method: 'GET',
      }),

    submitOffer: (shipmentId: string, price: number) =>
      apiRequest<ShipmentOffer>(`/shipments/${shipmentId}/offers`, {
        method: 'POST',
        body: JSON.stringify({ price }),
      }),

    acceptOffer: (shipmentId: string, offerId: string) =>
      apiRequest<Shipment>(`/shipments/${shipmentId}/offers/${offerId}/accept`, {
        method: 'POST',
      }),

    confirmHandover: (shipmentId: string) =>
      apiRequest<{ message: string; shipment: Shipment }>(
        `/shipments/${shipmentId}/confirm-handover`,
        { method: 'POST' }
      ),

    confirmDelivery: (shipmentId: string) =>
      apiRequest<{ message: string; shipment: Shipment }>(
        `/shipments/${shipmentId}/confirm-delivery`,
        { method: 'POST' }
      ),
  },

  // === CONVERSATION ENDPOINTS ===
  conversations: {
    getAll: () =>
      apiRequest<ConversationsResponse>('/conversations', { method: 'GET' }),

    getUnread: () =>
      apiRequest<UnreadConversationsResponse>('/conversations/unread', {
        method: 'GET',
      }),

    getById: (id: string) =>
      apiRequest<ConversationDetailResponse>(`/conversations/${id}`, {
        method: 'GET',
      }),

    create: (data: Record<string, unknown>) =>
      apiRequest<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    markAsRead: (id: string) =>
      apiRequest<{ message: string }>(`/conversations/${id}/read`, {
        method: 'POST',
      }),

    getMessages: (conversationId: string) =>
      apiRequest<MessagesResponse>(`/conversations/${conversationId}/messages`, {
        method: 'GET',
      }),

    sendMessage: (conversationId: string, content: string) =>
      apiRequest<{ message: Record<string, unknown> }>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },

  // === PAYMENT ENDPOINTS ===
  payments: {
    getMethods: () =>
      apiRequest<PaymentMethodsResponse>('/payments/methods', { method: 'GET' }),

    createMethod: (data: Record<string, unknown>) =>
      apiRequest<PaymentMethod>('/payments/methods', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    setDefaultMethod: (id: string) =>
      apiRequest<PaymentMethod>(`/payments/methods/${id}/default`, {
        method: 'PATCH',
      }),

    deleteMethod: (id: string) =>
      apiRequest<{ message: string }>(`/payments/methods/${id}`, {
        method: 'DELETE',
      }),

    getTransactions: () =>
      apiRequest<TransactionsResponse>('/payments/transactions', {
        method: 'GET',
      }),

    holdPayment: (shipmentId: string, courierId: string) =>
      apiRequest<PaymentHoldResponse>('/payments/hold', {
        method: 'POST',
        body: JSON.stringify({ shipmentId, courierId }),
      }),

    releasePayment: (shipmentId: string) =>
      apiRequest<PaymentReleaseResponse>(`/payments/release/${shipmentId}`, {
        method: 'POST',
      }),

    refundPayment: (shipmentId: string) =>
      apiRequest<PaymentRefundResponse>(`/payments/refund/${shipmentId}`, {
        method: 'POST',
      }),
  },

  // === TRAVEL ENDPOINTS ===
  travels: {
    getAll: () =>
      apiRequest<TravelsResponse>('/travels', { method: 'GET' }),

    create: (data: Record<string, unknown>) =>
      apiRequest<Travel>('/travels', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getById: (id: string) =>
      apiRequest<Travel>(`/travels/${id}`, { method: 'GET' }),

    update: (id: string, data: Record<string, unknown>) =>
      apiRequest<Travel>(`/travels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // === USER ENDPOINTS ===
  users: {
    getProfile: (userId: string) =>
      apiRequest<UserProfileResponse>(`/users/${userId}/profile`, {
        method: 'GET',
      }),
  },
};


