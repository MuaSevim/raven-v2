import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { initializeFirebase, getFirebaseAdmin } from './src/auth/firebase-admin';

async function wipeFirebase() {
  const prisma = new PrismaClient();
  initializeFirebase();
  const firebaseAdmin = getFirebaseAdmin();

  try {
    const dbUserCount = await prisma.user.count();
    console.log(`Database Users Count (should be 0): ${dbUserCount}`);

    console.log('Fetching Firebase users...');
    let listUsersResult = await firebaseAdmin.auth().listUsers(1000);
    const users = listUsersResult.users;
    console.log(`Found ${users.length} Firebase users.`);

    if (users.length > 0) {
      console.log('Deleting Firebase users...');
      const uids = users.map(u => u.uid);
      const deleteResult = await firebaseAdmin.auth().deleteUsers(uids);
      console.log(`Successfully deleted ${deleteResult.successCount} users.`);
      console.log(`Failed to delete ${deleteResult.failureCount} users.`);
    } else {
      console.log('No Firebase users to delete.');
    }
  } catch (error) {
    console.error('Error during wipe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeFirebase();
