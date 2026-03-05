# Raven v2: Decentralized P2P Logistics Protocol

[![TypeScript](https://img.shields.io/badge/TypeScript-98.6%25-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-red)](https://nestjs.com/)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native%20%2F%20Expo-lightgrey)](https://expo.dev/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-white)](https://www.prisma.io/)

**Raven** is a peer-to-peer (P2P) international logistics protocol designed to solve the "Parcel Gap." By connecting travelers with unused luggage capacity to senders in need of affordable, high-speed shipping, Raven transforms global flight infrastructure into a decentralized delivery network.

---

## 🚀 The Vision
Traditional logistics (DHL, FedEx) rely on expensive, rigid hub-and-spoke models that impose a "tax" on progress through high costs and artificial latency. Raven moves from a **Social Graph** to a **Utility Graph**, monetizing the "Dead Capital" of airline luggage allowances.

* **For Senders (Scribes):** Ship small, urgent items (medicine, documents, home comforts) at a fraction of the cost of commercial carriers.
* **For Travelers (Ravens):** Subsidize travel costs by monetizing empty suitcase space.



---

## 🛠️ Technical Stack

* **Mobile Client:** React Native (Expo) with a monochromatic, high-contrast design system inspired by Uber's Base Design.
* **Backend:** NestJS providing a modular, type-safe RESTful API.
* **Database:** PostgreSQL with **Prisma ORM** for strict relational integrity and ACID compliance.
* **Authentication:** Firebase Admin SDK for server-side cryptographic identity verification.
* **State Management:** Zustand for lightweight, efficient global state.



---

## 🛡️ Key Engineering Features

### **The Atomic Handshake Protocol**
A custom-built state machine that ensures secure custody transfer without a central authority. Using Prisma interactive transactions, the protocol atomically locks capacity and manages escrow funds only when both parties digitally sign the physical handover.

### **Zero-Trust Security**
By integrating server-side verification of Firebase tokens, the system ensures that user identity is verified against real-world government documents (passports/IDs) before any transaction is initiated.

### **Real-Time Synchronization**
Optimized for low-latency interactions, the system ensures sub-200ms updates for matching, messaging, and status transitions across cross-platform devices.

---

## 📂 Repository Structure

```bash
├── .agent           # Latest snapshots and system documentation
├── client           # Expo/React Native mobile codebase
│   ├── components   # Reusable UI modules (8px grid based)
│   └── screens      # Smart containers for application logic
├── server           # NestJS backend modules
│   ├── src          # Auth, Shipment, and Travel controllers
│   └── prisma       # Database schema and migrations
└── validate-system.js # System-wide platform debugging scripts