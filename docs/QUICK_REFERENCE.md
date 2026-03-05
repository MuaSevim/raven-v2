# Raven V2 - Quick Reference Guide

## 🎯 Project Overview

**Raven** is a peer-to-peer shipment delivery platform connecting people who need to send packages with travelers who have extra luggage space.

### Core Concept
- **Senders** post shipments they need delivered
- **Couriers** (travelers) browse and offer to deliver
- **Platform** facilitates matching, communication, and payment

## 🏗️ Tech Stack at a Glance

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile Client** | React Native + Expo | Cross-platform iOS/Android app |
| **State Management** | Zustand | Lightweight global state |
| **Navigation** | React Navigation | Screen routing |
| **Backend** | NestJS | RESTful API server |
| **Database** | PostgreSQL + Prisma | Relational data storage |
| **Authentication** | Firebase Auth | User management |
| **File Storage** | Cloudinary | Image hosting (CDN) |
| **Maps** | Google Maps API | Location services |

## 📱 Key User Flows

### 1. Sign Up Flow (5 Steps)
```
SignUpStep1 → Email & Password
SignUpStep2 → First Name & Last Name
SignUpStep3 → Phone Number
SignUpStep4 → Birthday
SignUpStep5 → Location (Country & City)
```

### 2. Post Shipment Flow (6 Steps)
```
SetRoute → Select origin & destination
PackageDetails → Weight, content, photo
DeliveryWindow → Date range
SetPrice → Price & currency
ContactDetails → Sender info
ReviewShipment → Confirm all details
FinalizeDetails → Submit
```

### 3. Delivery Process
```
OPEN → Courier makes offer
MATCHED → Sender accepts offer
HANDED_OVER → Both confirm handover (payment held)
ON_WAY → Courier in transit
DELIVERED → Both confirm delivery (payment released)
```

## 🎨 Design System Quick Reference

### Colors
```typescript
Primary: #000000 (Black)
Accent: #276EF1 (Blue)
Success: #05944F (Green)
Warning: #FFC043 (Amber)
Error: #E11900 (Red)

Background: #FFFFFF (White)
Background Secondary: #F6F6F6 (Light Gray)

Text Primary: #000000
Text Secondary: #545454
Text Tertiary: #757575
```

### Typography
```typescript
Font: Inter (400, 500, 600, 700)

Sizes:
xs: 12px
sm: 14px
base: 16px
lg: 18px
xl: 20px
2xl: 24px
3xl: 32px
```

### Spacing (8px Grid)
```typescript
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 40px
3xl: 48px
```

### Component Dimensions
```typescript
Input Height: 56px
Button Height: 56px
Icon Size: 24px
Header Height: 56px
```

## 🗄️ Database Models

### Core Models
1. **User** - User accounts (Firebase UID as primary key)
2. **Shipment** - Package delivery requests
3. **Travel** - Traveler's upcoming trips
4. **Conversation** - Chat between users
5. **Message** - Individual chat messages
6. **Transaction** - Payment records
7. **PaymentMethod** - Saved payment cards

### Key Relationships
- User → Shipments (as sender or courier)
- User → Travels (as traveler)
- Shipment → Offers (from couriers)
- Shipment → Conversation (between sender & courier)
- Conversation → Messages
- Shipment → Transaction (payment)

## 🔌 Main API Endpoints

### Authentication
```
POST /auth/signin
POST /auth/signup
GET /auth/me
```

### Shipments
```
POST /shipments
GET /shipments
GET /shipments/:id
PATCH /shipments/:id
POST /shipments/:id/offers
POST /shipments/:id/confirm-handover
POST /shipments/:id/confirm-delivery
```

### Conversations
```
GET /conversations
POST /conversations
GET /conversations/:id/messages
POST /conversations/:id/messages
```

### Users
```
GET /users/:id
PATCH /users/:id
POST /users/:id/avatar
```

### Payments
```
POST /payments/methods
GET /payments/methods
POST /payments/transactions
GET /payments/transactions
```

## 📂 Project Structure

```
codebase/
├── client/                 # React Native app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # Screen components
│   │   ├── navigation/    # Navigation config
│   │   ├── services/      # API & external services
│   │   ├── store/         # Zustand state management
│   │   ├── theme/         # Design system
│   │   └── utils/         # Utility functions
│   └── assets/            # Images, fonts, etc.
│
├── server/                # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # Users module
│   │   ├── shipments/     # Shipments module
│   │   ├── travels/       # Travels module
│   │   ├── conversations/ # Chat module
│   │   ├── payments/      # Payments module
│   │   └── prisma/        # Database service
│   └── prisma/            # Database schema & migrations
│
└── docs/                  # Documentation (this folder)
    ├── ARCHITECTURE.md
    ├── COMPONENT_TREE.md
    ├── API.md
    └── HOW_TO_USE_DIAGRAMS.md
```

## 🚀 Getting Started Commands

### Client (Mobile App)
```bash
cd client
npm install
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
```

### Server (Backend)
```bash
cd server
npm install
npx prisma generate    # Generate Prisma client
npx prisma migrate dev # Run migrations
npm run start:dev      # Start dev server
```

## 🔐 Environment Variables

### Client (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
```

### Server (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
FIREBASE_PROJECT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## 📊 Key Features

### For Senders
- ✅ Post shipment requests
- ✅ Set price and delivery window
- ✅ Review courier offers
- ✅ Chat with potential couriers
- ✅ Confirm handover and delivery
- ✅ Make payments via escrow

### For Couriers
- ✅ Browse available shipments
- ✅ Make offers to deliver
- ✅ Post upcoming travels
- ✅ Chat with senders
- ✅ Confirm handover and delivery
- ✅ Receive payments

### Platform Features
- ✅ User authentication (Firebase)
- ✅ Real-time messaging
- ✅ Payment escrow system
- ✅ User profiles & verification
- ✅ Activity tracking
- ✅ Earnings dashboard
- ✅ Location-based search

## 🔄 Shipment Status Flow

```
OPEN
  ↓ (Courier makes offer, sender accepts)
MATCHED
  ↓ (Both parties confirm handover)
HANDED_OVER
  ↓ (Courier in transit)
ON_WAY
  ↓ (Both parties confirm delivery)
DELIVERED
```

**Payment Flow:**
- Payment held in escrow when status = HANDED_OVER
- Payment released to courier when status = DELIVERED

## 🎯 State Management (Zustand)

### useAuthStore
```typescript
{
  user: User | null,
  loading: boolean,
  setUser: (user) => void,
  logout: () => void
}
```

### useShipmentStore
```typescript
{
  shipmentData: ShipmentData,
  currentStep: number,
  updateShipmentData: (data) => void,
  resetShipment: () => void
}
```

### useSignupStore
```typescript
{
  signupData: SignupData,
  updateSignupData: (data) => void,
  resetSignup: () => void
}
```

## 🧩 Reusable Components

### UI Components (`components/ui/`)
- Button
- Input
- Card
- Modal
- Badge
- Avatar
- Checkbox

### Domain Components
- **Home**: ShipmentCard, TravelCard, FilterChip
- **Shipment**: LocationPicker, DatePicker, WeightInput
- **Chat**: MessageBubble

## 📱 Main Tabs

1. **HomeTab** - Browse shipments and travels
2. **ActivitiesTab** - Track your shipments/deliveries
3. **InboxTab** - Messages and conversations
4. **ProfileTab** - User profile and settings

## 🔍 Search & Filters

### Shipment Filters
- Origin country/city
- Destination country/city
- Date range
- Price range
- Package type

### Travel Filters
- From country/city
- To country/city
- Departure date
- Available weight

## 💳 Payment System

### Payment Methods
- Visa
- Mastercard
- American Express
- PayPal (future)
- Swish (future)

### Transaction Statuses
- **PENDING** - Transaction created
- **HELD** - Payment held in escrow
- **RELEASED** - Payment sent to courier
- **REFUNDED** - Payment returned to sender
- **FAILED** - Transaction failed

## 🔔 Notification Types

- New offer on your shipment
- Offer accepted
- Handover confirmed
- Delivery confirmed
- New message
- Payment received

## 📈 User Statistics

- Total deliveries completed
- Average rating
- Total earnings
- Verification status
- Member since date

## 🛡️ Security Features

1. **Firebase Authentication** - Secure user management
2. **JWT Tokens** - API authentication
3. **Password Hashing** - Secure password storage
4. **HTTPS** - Encrypted communication
5. **Input Validation** - Prevent injection attacks
6. **Authorization Guards** - Resource access control

## 🐛 Debugging Tools

### Client
- React Native Debugger
- Expo Dev Tools
- Network Diagnostics Screen

### Server
- NestJS Logger
- Prisma Studio (database GUI)
- Postman/Insomnia (API testing)

## 📚 Documentation Files

1. **README.md** - Project overview and setup
2. **ARCHITECTURE.md** - System architecture and flows
3. **COMPONENT_TREE.md** - Component hierarchy
4. **API.md** - API endpoints and examples
5. **HOW_TO_USE_DIAGRAMS.md** - Diagram usage guide
6. **QUICK_REFERENCE.md** - This file

## 🎓 Learning Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Firebase Docs](https://firebase.google.com/docs)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Update documentation

## 📞 Support

For issues or questions:
- Check documentation in `docs/`
- Review code comments
- Test in NetworkDiagnosticsScreen
- Check server logs
