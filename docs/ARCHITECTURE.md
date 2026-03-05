# Raven V2 - System Architecture Documentation

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Native App<br/>Expo SDK 54]
        A1[Zustand State Management]
        A2[React Navigation]
        A3[Axios HTTP Client]
    end
    
    subgraph "Authentication Layer"
        B[Firebase Auth]
        B1[Email/Password]
        B2[JWT Tokens]
    end
    
    subgraph "Backend Layer"
        C[NestJS Server]
        C1[Auth Module]
        C2[Users Module]
        C3[Shipments Module]
        C4[Travels Module]
        C5[Conversations Module]
        C6[Payments Module]
    end
    
    subgraph "Data Layer"
        D[(PostgreSQL Database)]
        D1[Prisma ORM]
    end
    
    subgraph "External Services"
        E1[Firebase Admin SDK]
        E2[Cloudinary<br/>Image Storage]
        E3[Google Maps API]
    end
    
    A --> A1
    A --> A2
    A --> A3
    A3 -->|REST API| C
    A -->|Auth| B
    B -->|Verify Token| C1
    C --> C1
    C --> C2
    C --> C3
    C --> C4
    C --> C5
    C --> C6
    C1 --> D1
    C2 --> D1
    C3 --> D1
    C4 --> D1
    C5 --> D1
    C6 --> D1
    D1 --> D
    C1 --> E1
    C3 --> E2
    A --> E3
    
    style A fill:#276EF1,color:#fff
    style C fill:#E11900,color:#fff
    style D fill:#05944F,color:#fff
```

## 🔄 Application Flow

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client App
    participant F as Firebase Auth
    participant S as NestJS Server
    participant DB as PostgreSQL
    
    U->>C: Open App
    C->>F: Check Auth State
    
    alt Not Authenticated
        C->>U: Show Sign In Screen
        U->>C: Enter Credentials
        C->>F: signInWithEmailAndPassword()
        F-->>C: Firebase User + ID Token
        C->>S: POST /auth/signin (with token)
        S->>F: Verify ID Token
        F-->>S: Token Valid
        S->>DB: Find/Create User
        DB-->>S: User Data
        S-->>C: User Profile + JWT
        C->>C: Store in Zustand
        C->>U: Navigate to MainTabs
    else Already Authenticated
        C->>U: Show MainTabs
    end
```

### Shipment Creation Flow (6-Step Process)

```mermaid
stateDiagram-v2
    [*] --> SetRoute: User clicks "Post Shipment"
    SetRoute --> PackageDetails: Select Origin & Destination
    PackageDetails --> DeliveryWindow: Enter Weight & Content
    DeliveryWindow --> SetPrice: Choose Date Range
    SetPrice --> ContactDetails: Set Price & Currency
    ContactDetails --> ReviewShipment: Enter Sender Info
    ReviewShipment --> FinalizeDetails: Review All Details
    FinalizeDetails --> DeliveryPosted: Confirm & Submit
    DeliveryPosted --> [*]: Shipment Created
    
    note right of SetRoute
        User selects countries
        and cities using
        location API
    end note
    
    note right of FinalizeDetails
        API Call: POST /shipments
        Upload image to Cloudinary
        Store in PostgreSQL
    end note
```

### Shipment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> OPEN: Shipment Posted
    OPEN --> MATCHED: Courier Accepts Offer
    MATCHED --> HANDED_OVER: Both Parties Confirm Handover
    HANDED_OVER --> ON_WAY: Courier in Transit
    ON_WAY --> DELIVERED: Both Parties Confirm Delivery
    DELIVERED --> [*]: Payment Released
    
    OPEN --> CANCELLED: Sender Cancels
    MATCHED --> CANCELLED: Either Party Cancels
    CANCELLED --> [*]
    
    note right of HANDED_OVER
        senderConfirmedHandover = true
        courierConfirmedHandover = true
        Payment held in escrow
    end note
    
    note right of DELIVERED
        senderConfirmedDelivery = true
        courierConfirmedDelivery = true
        Payment released to courier
    end note
```

## 📱 Navigation Structure

```mermaid
graph TD
    A[App Entry] --> B{User Authenticated?}
    
    B -->|No| C[Auth Stack]
    C --> C1[SignIn]
    C --> C2[SignUpStep1]
    C --> C3[SignUpStep2]
    C --> C4[SignUpStep3]
    C --> C5[SignUpStep4]
    C --> C6[SignUpStep5]
    C --> C7[Welcome]
    
    B -->|Yes| D[MainTabs]
    D --> D1[HomeTab]
    D --> D2[ActivitiesTab]
    D --> D3[InboxTab]
    D --> D4[ProfileTab]
    
    D1 --> E[Shipment Flow]
    E --> E1[SetRoute]
    E --> E2[PackageDetails]
    E --> E3[DeliveryWindow]
    E --> E4[SetPrice]
    E --> E5[ContactDetails]
    E --> E6[ReviewShipment]
    E --> E7[FinalizeDetails]
    E --> E8[DeliveryPosted]
    
    D1 --> F[ShipmentDetail]
    D2 --> G[ActivityDetail]
    D3 --> H[Chat]
    D4 --> I[Settings]
    I --> I1[PaymentMethods]
    I --> I2[UpdatePassword]
    I --> I3[About]
    I --> I4[PrivacyPolicy]
    I --> I5[HelpSupport]
    
    style D fill:#276EF1,color:#fff
    style E fill:#FFC043,color:#000
```

## 🗄️ Database Schema (ER Diagram)

```mermaid
erDiagram
    User ||--o{ Shipment : "sends (sender)"
    User ||--o{ Shipment : "delivers (courier)"
    User ||--o{ ShipmentOffer : "makes offers"
    User ||--o{ Travel : "posts travels"
    User ||--o{ Conversation : "participates (user1)"
    User ||--o{ Conversation : "participates (user2)"
    User ||--o{ Message : "sends"
    User ||--o{ PaymentMethod : "owns"
    User ||--o{ Transaction : "pays (payer)"
    User ||--o{ Transaction : "receives (payee)"
    
    Shipment ||--o{ ShipmentOffer : "receives offers"
    Shipment ||--o{ Conversation : "discussed in"
    Shipment ||--|| Transaction : "has payment"
    
    Conversation ||--o{ Message : "contains"
    
    PaymentMethod ||--o{ Transaction : "used for"
    
    User {
        string id PK "Firebase UID"
        string email UK
        string firstName
        string lastName
        string phone
        string country
        string city
        string avatar
        boolean isVerified
        datetime joinedAt
    }
    
    Shipment {
        string id PK
        string originCountry
        string originCity
        string destCountry
        string destCity
        float weight
        string content
        string packageType
        datetime dateStart
        datetime dateEnd
        float price
        string status
        boolean senderConfirmedHandover
        boolean courierConfirmedHandover
        boolean senderConfirmedDelivery
        boolean courierConfirmedDelivery
        string senderId FK
        string courierId FK
    }
    
    ShipmentOffer {
        string id PK
        string message
        string status
        string shipmentId FK
        string courierId FK
    }
    
    Travel {
        string id PK
        string fromCountry
        string fromCity
        string toCountry
        string toCity
        datetime departureDate
        float availableWeight
        float pricePerKg
        string status
        string travelerId FK
    }
    
    Conversation {
        string id PK
        string user1Id FK
        string user2Id FK
        string shipmentId FK
        string status
        string lastMessage
        datetime lastMessageAt
    }
    
    Message {
        string id PK
        string content
        string type
        string status
        boolean isRead
        string conversationId FK
        string senderId FK
    }
    
    PaymentMethod {
        string id PK
        string cardType
        string lastFour
        string cardHolder
        int expiryMonth
        int expiryYear
        boolean isDefault
        string userId FK
    }
    
    Transaction {
        string id PK
        float amount
        string currency
        string status
        string payerId FK
        string payeeId FK
        string shipmentId FK
        string paymentMethodId FK
    }
```

## 🔌 API Integration Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as NestJS API
    participant Auth as Auth Guard
    participant Service as Service Layer
    participant Prisma as Prisma ORM
    participant DB as PostgreSQL
    participant Cloud as Cloudinary
    
    C->>API: POST /shipments (with JWT)
    API->>Auth: Validate JWT Token
    Auth->>API: User Authenticated
    
    alt Has Image
        API->>Cloud: Upload Image
        Cloud-->>API: Image URL
    end
    
    API->>Service: createShipment(data)
    Service->>Prisma: prisma.shipment.create()
    Prisma->>DB: INSERT INTO shipments
    DB-->>Prisma: Shipment Record
    Prisma-->>Service: Shipment Object
    Service-->>API: Created Shipment
    API-->>C: 201 Created + Shipment Data
```

## 🧩 Technology Stack

### Client (Mobile)
- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Language**: TypeScript 5.9.2
- **State Management**: Zustand 5.0.9
- **Navigation**: React Navigation 7.x
- **HTTP Client**: Axios 1.13.2
- **Authentication**: Firebase 12.7.0
- **Maps**: React Native Maps 1.20.1
- **Icons**: Lucide React Native 0.562.0
- **Fonts**: Inter (Google Fonts)

### Server (Backend)
- **Framework**: NestJS 11.0.1
- **Language**: TypeScript 5.7.3
- **Database**: PostgreSQL with Prisma 7.2.0
- **Authentication**: Passport JWT + Firebase Admin 13.6.0
- **Image Storage**: Cloudinary 2.8.0
- **Validation**: class-validator 0.14.3

### Infrastructure
- **Database**: PostgreSQL (Production-ready relational DB)
- **File Storage**: Cloudinary (CDN for images)
- **Authentication**: Firebase Auth (User management)
- **API**: RESTful architecture

## 📊 Data Flow Summary

1. **User Authentication**: Firebase → NestJS verification → PostgreSQL user lookup
2. **Shipment Creation**: Client form → NestJS API → Cloudinary (images) → PostgreSQL
3. **Real-time Chat**: Client → NestJS → PostgreSQL (messages stored)
4. **Payment Processing**: Client → NestJS → PostgreSQL (escrow system)
5. **Location Services**: Client → Google Maps API (direct)

## 🔐 Security Layers

1. **Firebase Authentication** - Email/password with JWT tokens
2. **NestJS Guards** - JWT validation on protected routes
3. **Prisma ORM** - SQL injection prevention
4. **HTTPS** - Encrypted communication (production)
5. **Environment Variables** - Sensitive data protection
