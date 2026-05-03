/**
 * API Response Types
 * Centralized type definitions for all API endpoints
 */

// Auth Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthMeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  createdAt: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  email: string;
}

// Shipment Types
export interface Shipment {
  id: string;
  senderId: string;
  receiver: {
    name: string;
    phone: string;
    email?: string;
  };
  departure: {
    location: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    location: string;
    latitude: number;
    longitude: number;
  };
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  imageUrl?: string;
  price: number;
  currency: string;
  weight?: number;
  dimensions?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentOffer {
  id: string;
  shipmentId: string;
  courierId: string;
  courier?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  price: number;
  estimatedDeliveryTime?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

export interface ShipmentsResponse {
  data: Shipment[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ShipmentOffersResponse {
  data: ShipmentOffer[];
  meta?: {
    total: number;
  };
}

// Conversation Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unread: boolean;
  updatedAt: string;
}

export interface ConversationsResponse {
  data: Conversation[];
}

export interface ConversationDetailResponse {
  id: string;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }[];
  messages: Message[];
}

export interface UnreadConversationsResponse {
  unread: number;
}

export interface MessagesResponse {
  data: Message[];
}

// Payment Types
export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'wallet';
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  shipmentId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'HELD' | 'RELEASED' | 'REFUNDED';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodsResponse {
  data: PaymentMethod[];
}

export interface TransactionsResponse {
  data: PaymentTransaction[];
}

export interface PaymentHoldResponse {
  transactionId: string;
  status: 'HELD';
  amount: number;
}

export interface PaymentReleaseResponse {
  transactionId: string;
  status: 'RELEASED';
  amount: number;
}

export interface PaymentRefundResponse {
  transactionId: string;
  status: 'REFUNDED';
  amount: number;
}

// Travel Types
export interface Travel {
  id: string;
  courierId: string;
  route: {
    departure: {
      location: string;
      latitude: number;
      longitude: number;
    };
    destination: {
      location: string;
      latitude: number;
      longitude: number;
    };
  };
  departureDate: string;
  capacity?: number;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface TravelsResponse {
  data: Travel[];
  meta?: {
    total: number;
  };
}

// User Profile Types
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  about?: string;
  rating?: number;
  totalShipments?: number;
  totalDeliveries?: number;
  createdAt: string;
}

export interface UserProfileResponse {
  user: UserProfile;
}

// Generic API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Error Response
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
