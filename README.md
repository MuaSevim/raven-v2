# Raven V2 Codebase

Welcome to the Raven V2 project. This is a monorepo-style structure containing the mobile client and the backend server.

## Project Structure

- `client/`: React Native (Expo) mobile application.
- `server/`: NestJS backend API.

## Design System

The project uses a custom Design System inspired by Uber's Base Design System.

- **Font**: Inter (from Google Fonts)
- **Colors**:
  - Primary: `#000000`
  - Accent: `#276EF1` (Blue)
  - Backgrounds: White (`#FFFFFF`) and Light Grays (`#F6F6F6`, `#F0F2F5`)
- **Spacing**: 8px grid system.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- PostgreSQL database (for Server)

### Client (Mobile App)

The client is built with Expo, React Native, and TypeScript.

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on Android/iOS:
   - Press `a` for Android Emulator.
   - Press `i` for iOS Simulator.
   - Or scan the QR code with Expo Go app on your physical device.

**Key Technologies:**
- Expo ~52.0.0
- React Native 0.76.3
- Zustand (State Management)
- Axios (Networking)
- React Navigation

### Server (Backend)

The server is built with NestJS, Prisma, and PostgreSQL.

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in the `server` root based on your configuration needs (Database URL, JWT secrets, etc.).

4. Database Setup:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start the server:
   ```bash
   npm run start:dev
   ```

**Key Technologies:**
- NestJS
- Prisma ORM
- PostgreSQL
- Firebase Admin
- Cloudinary
- Passport JWT

## Scripts

Check `package.json` in each directory for available scripts.

- `client`: `start`, `android`, `ios`, `web`
- `server`: `build`, `start:dev`, `test`, `lint`

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

### Architecture & System Design
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete system architecture with diagrams
  - System architecture overview
  - Authentication & shipment flows
  - Database schema (ER diagram)
  - API integration patterns
  - Technology stack details

### Component Documentation
- **[COMPONENT_TREE.md](docs/COMPONENT_TREE.md)** - React Native component hierarchy
  - Complete component tree
  - Reusable UI components
  - File structure
  - State management architecture
  - Component data flow

### API Reference
- **[API.md](docs/API.md)** - Backend API documentation
  - All API endpoints
  - Request/response examples
  - Authentication & authorization
  - Error handling
  - Data synchronization

### Quick References
- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Essential information at a glance
  - Tech stack summary
  - Key user flows
  - Design system reference
  - Database models
  - Common commands

### Diagram Tools
- **[HOW_TO_USE_DIAGRAMS.md](docs/HOW_TO_USE_DIAGRAMS.md)** - Guide to viewing and editing diagrams
  - VS Code setup
  - Eraser.io integration
  - Export options
  - Customization tips

## 🎨 Design System

The project uses a custom design system inspired by Uber's Base Design System. Full details in `client/src/theme/index.ts`.

**Key Highlights:**
- **Typography**: Inter font family (400, 500, 600, 700)
- **Colors**: High-contrast black/white with blue accent (#276EF1)
- **Spacing**: 8px grid system
- **Components**: 56px standard height for inputs/buttons

See [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) for complete design tokens.

## 🚀 Key Features

- ✅ **Peer-to-peer shipment delivery** platform
- ✅ **Firebase authentication** with email/password
- ✅ **6-step shipment creation** flow
- ✅ **Real-time messaging** between users
- ✅ **Payment escrow system** for secure transactions
- ✅ **Location-based search** with Google Maps
- ✅ **User verification** and ratings
- ✅ **Activity tracking** and earnings dashboard

## 🔐 Security

- Firebase Authentication for user management
- JWT tokens for API authentication
- Prisma ORM for SQL injection prevention
- Environment variables for sensitive data
- HTTPS encryption (production)

## 📊 Project Status

**Current Version**: 1.0.0  
**Status**: Active Development

For detailed architecture and flows, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).
