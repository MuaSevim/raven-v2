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
  avatar?: string | null;
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
  phoneCode?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  avatar?: string | null;
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
  senderId?: string;
  receiver?: {
    name: string;
    phone: string;
    email?: string;
  };
  departure?: {
    location: string;
    latitude: number;
    longitude: number;
  };
  destination?: {
    location: string;
    latitude: number;
    longitude: number;
  };
  originCity?: string;
  originCountry?: string;
  destCity?: string;
  destCountry?: string;
  dateStart?: string;
  dateEnd?: string;
  content?: string;
  packageType?: string;
  weight?: number;
  weightUnit?: string;
  status: 'OPEN' | 'MATCHED' | 'HANDED_OVER' | 'ON_WAY' | 'DELIVERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  imageUrl?: string;
  price: number;
  currency: string;
  dimensions?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deliveryConfirmedAt?: string | null;
  handoverConfirmedAt?: string | null;
  senderConfirmedHandover?: boolean;
  courierConfirmedHandover?: boolean;
  senderConfirmedDelivery?: boolean;
  courierConfirmedDelivery?: boolean;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    isVerified?: boolean;
  };
  courierId?: string | null;
  courier?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    isVerified?: boolean;
  } | null;
  _count?: { offers: number };
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
  type?: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  status?: string;
  user1Id?: string;
  user1?: { id: string; firstName: string | null; lastName: string | null };
  user2?: { id: string; firstName: string | null; lastName: string | null };
  otherUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isVerified: boolean;
  };
  shipment?: {
    id: string;
    originCity?: string;
    destCity?: string;
    price?: number;
    currency?: string;
    status?: string;
    senderId?: string;
    courierId?: string;
    content?: string;
    senderConfirmedHandover?: boolean;
    courierConfirmedHandover?: boolean;
    senderConfirmedDelivery?: boolean;
    courierConfirmedDelivery?: boolean;
    offers?: {
      id: string;
      status: string;
      courierId: string;
      message?: string;
      courier?: {
        id: string;
        firstName: string;
        lastName: string;
      };
    }[];
  };
  messages?: Message[];
  isSender?: boolean;
  canMatch?: boolean;
  participants?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
    status?: string;
    sender?: { id: string };
  } | null;
  unread?: boolean;
  unreadCount?: number;
  updatedAt: string;
}

export interface ConversationsResponse {
  data: Conversation[];
}

export type ConversationDetailResponse = Conversation;

export interface UnreadConversationsResponse {
  unreadCount: number;
}

export interface MessagesResponse {
  data: Message[];
}

// Payment Types
export interface PaymentMethod {
  id: string;
  userId?: string;
  cardType?: string;
  lastFour: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardHolder?: string;
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
  shipment?: Shipment;
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
  courierId?: string;
  fromCountry?: string;
  fromCity?: string;
  fromAirportCode?: string | null;
  toCountry?: string;
  toCity?: string;
  toAirportCode?: string | null;
  departureDate?: string;
  arrivalDate?: string | null;
  availableWeight?: number;
  weightUnit?: string;
  pricePerKg?: number | null;
  currency?: string;
  flightNumber?: string | null;
  status?: string;
  traveler?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    isVerified: boolean;
    country: string | null;
    city: string | null;
  };
  route?: {
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
  capacity?: number;
  description?: string;
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
  firstName: string | null;
  lastName: string | null;
  email?: string;
  phone?: string;
  profilePicture?: string;
  avatar?: string | null;
  isVerified?: boolean;
  country?: string | null;
  city?: string | null;
  joinedAt?: string;
  about?: string;
  rating?: number;
  totalShipments?: number;
  totalDeliveries?: number;
  createdAt?: string;
  stats?: {
    shipmentsPosted: number;
    deliveriesCompleted: number;
    averageRating: number;
    totalReviews: number;
  };
  reviews?: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: {
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
    };
  }[];
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
