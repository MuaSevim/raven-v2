import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { initializeFirebase, getFirebaseAdmin } from './firebase-admin';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // Initialize Firebase Admin when the module starts
    initializeFirebase();
  }

  async syncUser(idToken: string) {
    const firebaseAdmin = getFirebaseAdmin();
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // This saves the Google user into your Supabase table automatically
    return await this.prisma.user.upsert({
      where: { id: uid },
      update: { name: name || null, avatar: picture || null },
      create: {
        id: uid,
        email: email || '',
        name: name || null,
        avatar: picture || null,
        role: 'SENDER',
      },
    });
  }

  async getUserById(uid: string) {
    return this.prisma.user.findUnique({
      where: { id: uid },
    });
  }

  async updateUserRole(uid: string, role: 'SENDER' | 'COURIER') {
    return this.prisma.user.update({
      where: { id: uid },
      data: { role },
    });
  }
}
