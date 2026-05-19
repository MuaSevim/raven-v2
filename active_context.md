# Raven Platform — Active Development Context

## 1. System Architecture State
* **Backend API:** NestJS deployed on Railway (`raven-v2-production.up.railway.app`)
* **Primary Database:** Aiven PostgreSQL 17 via Prisma ORM
* **Auth & Storage:** Firebase Client/Admin SDK (Email OOB only) & Direct-to-Cloud Storage
* **Real-Time Engine:** Firebase Cloud Firestore (`chats` collection)

## 2. Current Git & Workspace State
* **Active Branch:** `main`
* **Status:** Server build passed cleanly after Prisma/client regeneration.
* **Latest Major Integration:** Verification schema refactor completed and client/server types aligned.
* **Database:** Reset completed; all records cleared.

## 3. Completed Architecture Upgrades (Do Not Revert)
* [x] Migrated from Supabase to Aiven PostgreSQL.
* [x] Eradicated base64 image payloads; implemented direct client-to-Firebase upload (0.4 compression).
* [x] Stale-While-Revalidate (SWR) caching implemented across Home, Deliveries, Profile, and Inbox.
* [x] Chat UI overhauled to monochromatic design (removed green tracking bars).
* [x] Counter-offer full-stack flow implemented (Prisma schema → NestJS → ChatScreen modal).

## 4. Current Task / Active Focus
* **Objective:** Reduce reloads between navigation changes and tighten shared client state/caching.
* **Goal:** Keep profile, deliveries, and auth data warm in a universal cache/store so tab and screen focus do not trigger constant refetches.

## 5. Next Critical Dependencies
1. **Client Cache Strategy:** Consolidate shared reads like `auth:me` into a single source of truth and limit focus-driven refetches.
2. **Profile Flow:** Verify avatar, phone, and email update paths against the new verification schema.
3. **Travel Flow:** Confirm `pnr` is accepted end-to-end in create/update travel payloads.

## 6. Completed Schema Changes
* [x] Removed `isVerified` in favor of `verificationStatus`.
* [x] Removed `selfieUrl` from the user model.
* [x] Added `passport` to the user model.
* [x] Added `pnr` to the travel model and DTOs.
* [x] Updated seed behavior to preserve existing users.