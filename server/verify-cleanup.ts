import { PrismaClient } from '@prisma/client';
import { initializeFirebase, getFirebaseAdmin } from './src/auth/firebase-admin';

async function checkCleanup() {
  const prisma = new PrismaClient();
  initializeFirebase();
  const firebaseAdmin = getFirebaseAdmin();

  try {
    const dbUserCount = await prisma.user.count();
    console.log(`Database Users Count: ${dbUserCount}`);

    const firebaseUsers = await firebaseAdmin.auth().listUsers(10);
    console.log(`Firebase Users Count: ${firebaseUsers.users.length}`);

    if (firebaseUsers.users.length > 0) {
      console.log('Firebase Users:');
      firebaseUsers.users.forEach((u) => console.log(`- ${u.email} (${u.uid})`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCleanup();
