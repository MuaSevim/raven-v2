# Raven V2 - API Documentation

## 🔌 Backend API Structure

```mermaid
graph TD
    subgraph "NestJS Modules"
        A[App Module]
        A --> B[Auth Module]
        A --> C[Users Module]
        A --> D[Shipments Module]
        A --> E[Travels Module]
        A --> F[Conversations Module]
        A --> G[Payments Module]
    end
    
    subgraph "Auth Module"
        B --> B1[AuthController]
        B --> B2[AuthService]
        B --> B3[JwtStrategy]
        B --> B4[FirebaseAuthGuard]
    end
    
    subgraph "Users Module"
        C --> C1[UsersController]
        C --> C2[UsersService]
    end
    
    subgraph "Shipments Module"
        D --> D1[ShipmentsController]
        D --> D2[ShipmentsService]
    end
    
    subgraph "Travels Module"
        E --> E1[TravelsController]
        E --> E2[TravelsService]
    end
    
    subgraph "Conversations Module"
        F --> F1[ConversationsController]
        F --> F2[ConversationsService]
    end
    
    subgraph "Payments Module"
        G --> G1[PaymentsController]
        G --> G2[PaymentsService]
    end
    
    subgraph "Shared Services"
        H[PrismaService]
        I[CloudinaryService]
    end
    
    B2 --> H
    C2 --> H
    D2 --> H
    D2 --> I
    E2 --> H
    F2 --> H
    G2 --> H
    
    style A fill:#E11900,color:#fff
    style H fill:#05944F,color:#fff
    style I fill:#FFC043,color:#000
```

## 📡 API Endpoints Overview

### Authentication Endpoints

```mermaid
sequenceDiagram
    participant C as Client
    participant API as /auth
    participant Firebase as Firebase Admin
    participant DB as PostgreSQL
    
    Note over C,DB: Sign In Flow
    C->>API: POST /auth/signin<br/>{idToken}
    API->>Firebase: verifyIdToken(idToken)
    Firebase-->>API: Decoded Token
    API->>DB: findOrCreate User
    DB-->>API: User Data
    API-->>C: {user, accessToken}
    
    Note over C,DB: Sign Up Flow
    C->>API: POST /auth/signup<br/>{idToken, userData}
    API->>Firebase: verifyIdToken(idToken)
    Firebase-->>API: Decoded Token
    API->>DB: Create User
    DB-->>API: New User
    API-->>C: {user, accessToken}
```

**Endpoints:**
- `POST /auth/signin` - Sign in with Firebase ID token
- `POST /auth/signup` - Create new user account
- `GET /auth/me` - Get current user profile (protected)

### Users Endpoints

```mermaid
graph LR
    A[Client] -->|GET /users/:id| B[Get User Profile]
    A -->|PATCH /users/:id| C[Update User Profile]
    A -->|POST /users/:id/avatar| D[Upload Avatar]
    A -->|GET /users/:id/stats| E[Get User Statistics]
    
    style B fill:#276EF1,color:#fff
    style C fill:#276EF1,color:#fff
    style D fill:#276EF1,color:#fff
    style E fill:#276EF1,color:#fff
```

**Endpoints:**
- `GET /users/:id` - Get user profile by ID
- `PATCH /users/:id` - Update user profile
- `POST /users/:id/avatar` - Upload profile picture
- `GET /users/:id/stats` - Get user statistics (deliveries, ratings)

### Shipments Endpoints

```mermaid
sequenceDiagram
    participant C as Client
    participant API as /shipments
    participant Cloud as Cloudinary
    participant DB as PostgreSQL
    
    Note over C,DB: Create Shipment
    C->>API: POST /shipments<br/>{shipmentData, image}
    
    alt Has Image
        API->>Cloud: Upload Image
        Cloud-->>API: Image URL
    end
    
    API->>DB: Create Shipment
    DB-->>API: Shipment Record
    API-->>C: Created Shipment
    
    Note over C,DB: Get Shipments
    C->>API: GET /shipments?status=OPEN
    API->>DB: Query Shipments
    DB-->>API: Shipment List
    API-->>C: Filtered Shipments
```

**Endpoints:**
- `POST /shipments` - Create new shipment (protected)
- `GET /shipments` - Get all shipments (with filters)
- `GET /shipments/:id` - Get shipment details
- `PATCH /shipments/:id` - Update shipment (protected)
- `DELETE /shipments/:id` - Cancel shipment (protected)
- `POST /shipments/:id/offers` - Create offer for shipment (protected)
- `PATCH /shipments/:id/offers/:offerId` - Accept/reject offer (protected)
- `POST /shipments/:id/confirm-handover` - Confirm handover (protected)
- `POST /shipments/:id/confirm-delivery` - Confirm delivery (protected)

**Query Parameters:**
- `status`: Filter by status (OPEN, MATCHED, HANDED_OVER, ON_WAY, DELIVERED)
- `originCountry`: Filter by origin country
- `destCountry`: Filter by destination country
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `dateFrom`: Filter by start date
- `dateTo`: Filter by end date

### Travels Endpoints

```mermaid
graph TD
    A[Client] -->|POST /travels| B[Create Travel]
    A -->|GET /travels| C[List Travels]
    A -->|GET /travels/:id| D[Get Travel Details]
    A -->|PATCH /travels/:id| E[Update Travel]
    A -->|DELETE /travels/:id| F[Cancel Travel]
    
    style B fill:#FFC043,color:#000
    style C fill:#FFC043,color:#000
    style D fill:#FFC043,color:#000
    style E fill:#FFC043,color:#000
    style F fill:#FFC043,color:#000
```

**Endpoints:**
- `POST /travels` - Post upcoming travel (protected)
- `GET /travels` - Get all travels (with filters)
- `GET /travels/:id` - Get travel details
- `PATCH /travels/:id` - Update travel (protected)
- `DELETE /travels/:id` - Cancel travel (protected)

**Query Parameters:**
- `fromCountry`: Filter by origin country
- `toCountry`: Filter by destination country
- `dateFrom`: Filter by departure date
- `dateTo`: Filter by arrival date

### Conversations & Messages Endpoints

```mermaid
sequenceDiagram
    participant C as Client
    participant API as /conversations
    participant DB as PostgreSQL
    
    Note over C,DB: Start Conversation
    C->>API: POST /conversations<br/>{shipmentId, recipientId}
    API->>DB: Find or Create Conversation
    DB-->>API: Conversation
    API-->>C: Conversation Data
    
    Note over C,DB: Send Message
    C->>API: POST /conversations/:id/messages<br/>{content}
    API->>DB: Create Message
    DB-->>API: Message
    API->>DB: Update Conversation lastMessage
    API-->>C: Message Data
    
    Note over C,DB: Get Messages
    C->>API: GET /conversations/:id/messages
    API->>DB: Query Messages
    DB-->>API: Message List
    API-->>C: Messages
```

**Endpoints:**
- `GET /conversations` - Get user's conversations (protected)
- `POST /conversations` - Start new conversation (protected)
- `GET /conversations/:id` - Get conversation details (protected)
- `GET /conversations/:id/messages` - Get conversation messages (protected)
- `POST /conversations/:id/messages` - Send message (protected)
- `PATCH /conversations/:id/messages/:messageId/read` - Mark as read (protected)

### Payments Endpoints

```mermaid
graph LR
    A[Client] -->|POST /payments/methods| B[Add Payment Method]
    A -->|GET /payments/methods| C[List Payment Methods]
    A -->|DELETE /payments/methods/:id| D[Remove Payment Method]
    A -->|POST /payments/transactions| E[Create Transaction]
    A -->|GET /payments/transactions| F[List Transactions]
    A -->|PATCH /payments/transactions/:id/release| G[Release Payment]
    
    style B fill:#05944F,color:#fff
    style C fill:#05944F,color:#fff
    style E fill:#05944F,color:#fff
    style F fill:#05944F,color:#fff
    style G fill:#05944F,color:#fff
```

**Endpoints:**
- `POST /payments/methods` - Add payment method (protected)
- `GET /payments/methods` - Get user's payment methods (protected)
- `PATCH /payments/methods/:id` - Update payment method (protected)
- `DELETE /payments/methods/:id` - Remove payment method (protected)
- `POST /payments/transactions` - Create transaction (protected)
- `GET /payments/transactions` - Get user's transactions (protected)
- `GET /payments/transactions/:id` - Get transaction details (protected)
- `PATCH /payments/transactions/:id/release` - Release payment to courier (protected)
- `PATCH /payments/transactions/:id/refund` - Refund payment to sender (protected)

## 🔐 Authentication & Authorization

```mermaid
graph TD
    A[Client Request] --> B{Has JWT Token?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D[JWT Guard]
    D --> E{Valid Token?}
    E -->|No| C
    E -->|Yes| F{Resource Owner?}
    F -->|No| G[403 Forbidden]
    F -->|Yes| H[Process Request]
    
    style C fill:#E11900,color:#fff
    style G fill:#E11900,color:#fff
    style H fill:#05944F,color:#fff
```

**Protected Routes:**
All routes except the following require JWT authentication:
- `POST /auth/signin`
- `POST /auth/signup`
- `GET /shipments` (public listing)
- `GET /shipments/:id` (public view)
- `GET /travels` (public listing)
- `GET /travels/:id` (public view)

**Authorization Rules:**
- Users can only update/delete their own resources
- Only shipment sender can accept offers
- Only conversation participants can view/send messages
- Only transaction parties can view transaction details

## 📊 Request/Response Examples

### Create Shipment

**Request:**
```http
POST /shipments
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

{
  "originCountry": "Sweden",
  "originCity": "Stockholm",
  "destCountry": "Turkey",
  "destCity": "Istanbul",
  "weight": 5.5,
  "weightUnit": "kg",
  "content": "Electronics",
  "packageType": "Box",
  "dateStart": "2026-02-01T00:00:00Z",
  "dateEnd": "2026-02-15T23:59:59Z",
  "price": 150,
  "currency": "USD",
  "image": <file>
}
```

**Response:**
```json
{
  "id": "clx123abc456",
  "originCountry": "Sweden",
  "originCity": "Stockholm",
  "destCountry": "Turkey",
  "destCity": "Istanbul",
  "weight": 5.5,
  "weightUnit": "kg",
  "content": "Electronics",
  "packageType": "Box",
  "imageUrl": "https://res.cloudinary.com/...",
  "dateStart": "2026-02-01T00:00:00.000Z",
  "dateEnd": "2026-02-15T23:59:59.000Z",
  "price": 150,
  "currency": "USD",
  "status": "OPEN",
  "senderId": "firebase_uid_123",
  "sender": {
    "id": "firebase_uid_123",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "isVerified": true
  },
  "createdAt": "2026-01-04T15:45:22.000Z",
  "updatedAt": "2026-01-04T15:45:22.000Z"
}
```

### Get Conversations

**Request:**
```http
GET /conversations
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "conv_123",
    "user1Id": "firebase_uid_123",
    "user2Id": "firebase_uid_456",
    "shipmentId": "clx123abc456",
    "status": "ACTIVE",
    "lastMessage": "When can we meet for handover?",
    "lastMessageAt": "2026-01-04T14:30:00.000Z",
    "user1": {
      "id": "firebase_uid_123",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://..."
    },
    "user2": {
      "id": "firebase_uid_456",
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": "https://..."
    },
    "shipment": {
      "id": "clx123abc456",
      "originCity": "Stockholm",
      "destCity": "Istanbul",
      "price": 150
    },
    "createdAt": "2026-01-03T10:00:00.000Z",
    "updatedAt": "2026-01-04T14:30:00.000Z"
  }
]
```

## 🚨 Error Handling

```mermaid
graph TD
    A[API Request] --> B{Validation}
    B -->|Invalid| C[400 Bad Request]
    B -->|Valid| D{Authentication}
    D -->|Failed| E[401 Unauthorized]
    D -->|Success| F{Authorization}
    F -->|Forbidden| G[403 Forbidden]
    F -->|Allowed| H{Resource Exists?}
    H -->|No| I[404 Not Found]
    H -->|Yes| J{Business Logic}
    J -->|Error| K[409 Conflict / 422 Unprocessable]
    J -->|Success| L[200 OK / 201 Created]
    
    style C fill:#E11900,color:#fff
    style E fill:#E11900,color:#fff
    style G fill:#E11900,color:#fff
    style I fill:#E11900,color:#fff
    style K fill:#FFC043,color:#000
    style L fill:#05944F,color:#fff
```

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "weight",
      "message": "Weight must be a positive number"
    }
  ]
}
```

## 🔄 Data Synchronization

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Backend API
    participant DB as PostgreSQL
    participant Push as Push Notifications
    
    Note over C,Push: Real-time Updates
    C->>API: POST /shipments/:id/offers
    API->>DB: Create Offer
    DB-->>API: Offer Created
    API->>Push: Notify Shipment Owner
    API-->>C: 201 Created
    
    Note over C,Push: Status Updates
    C->>API: POST /shipments/:id/confirm-handover
    API->>DB: Update Shipment Status
    DB-->>API: Updated
    API->>Push: Notify Courier
    API-->>C: 200 OK
```

## 📈 Performance Considerations

1. **Pagination**: Large lists use cursor-based pagination
2. **Caching**: Frequently accessed data cached in memory
3. **Indexing**: Database indexes on frequently queried fields
4. **Image Optimization**: Cloudinary handles image compression
5. **Query Optimization**: Prisma includes only necessary relations

## 🔍 API Versioning

Current version: **v1** (implicit)

Future versions will use URL versioning:
- `/v1/shipments`
- `/v2/shipments`
