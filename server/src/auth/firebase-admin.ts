import * as admin from 'firebase-admin';

let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized || admin.apps.length) {
    return admin;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey!,
    }),
  });

  firebaseInitialized = true;
  return admin;
};

export const getFirebaseAdmin = () => {
  if (!firebaseInitialized && !admin.apps.length) {
    initializeFirebase();
  }
  return admin;
};
