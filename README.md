# Raven V2

A mobile delivery app with React Native (Expo) frontend and NestJS backend.

## Project Structure

```
codebase/
├── client/          # Expo React Native app
└── server/          # NestJS backend
```

## Setup

### Client (Expo)
```bash
cd client
npm install
npx expo start
```

### Server (NestJS)
```bash
cd server
npm install
npm run start:dev
```

## Environment Variables

### Server (.env)
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `DIRECT_URL` - Direct database connection for migrations
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key

### Client
- Configure in `src/services/authServices.ts` and `firebaseConfig.ts`

## Features
- Google Sign-In with Firebase Auth
- User sync to Supabase PostgreSQL
- NestJS backend with Prisma ORM
