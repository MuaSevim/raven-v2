import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { initializeFirebase, getFirebaseAdmin } from './firebase-admin';
import { CreateUserDto, SyncUserDto, UpdateUserDto } from './dto/auth.dto';

// Temporary in-memory store for verification codes
// In production, use Redis or database
const verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private prisma: PrismaService) { }

  onModuleInit() {
    // Initialize Firebase Admin when the module starts
    initializeFirebase();
  }

  /**
   * Register a new user with email/password via Firebase Auth
   */
  async registerUser(dto: CreateUserDto) {
    const firebaseAdmin = getFirebaseAdmin();
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if email already exists in our database
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    let firebaseUser;

    try {
      // Create user in Firebase Auth
      firebaseUser = await firebaseAdmin.auth().createUser({
        email: normalizedEmail,
        password: dto.password,
        displayName: `${dto.firstName} ${dto.lastName}`,
      });
    } catch (error) {
      // Handle Firebase-specific errors
      if (error.errorInfo?.code) {
        switch (error.errorInfo.code) {
          case 'auth/email-already-exists':
            throw new BadRequestException('This email address is already registered. Please sign in instead.');
          case 'auth/invalid-email':
            throw new BadRequestException('Invalid email address format.');
          case 'auth/invalid-password':
            throw new BadRequestException('Password must be at least 6 characters long.');
          case 'auth/weak-password':
            throw new BadRequestException('Password is too weak. Please use a stronger password.');
          default:
            throw new BadRequestException(`Registration failed: ${error.errorInfo.message}`);
        }
      }
      // Re-throw if it's not a Firebase error
      throw new BadRequestException('Failed to create user account. Please try again.');
    }

    // Create user in our database
    const user = await this.prisma.user.create({
      data: {
        id: firebaseUser.uid,
        email: normalizedEmail,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthDay: dto.birthDay,
        birthMonth: dto.birthMonth,
        birthYear: dto.birthYear,
        country: dto.country,
        countryCode: dto.countryCode,
        city: dto.city,
        isVerified: false,
        role: 'SENDER',
      },
    });

    return user;
  }

  /**
   * Sync user from Firebase Auth (for social logins or existing Firebase users)
   */
  async syncUser(dto: SyncUserDto) {
    const firebaseAdmin = getFirebaseAdmin();

    let decodedToken;
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(dto.idToken);
    } catch (error) {
      // Handle Firebase token verification errors
      if (error.errorInfo?.code) {
        switch (error.errorInfo.code) {
          case 'auth/id-token-expired':
            throw new BadRequestException('Authentication token has expired. Please sign in again.');
          case 'auth/invalid-id-token':
            throw new BadRequestException('Invalid authentication token.');
          case 'auth/user-disabled':
            throw new BadRequestException('This account has been disabled.');
          default:
            throw new BadRequestException(`Authentication failed: ${error.errorInfo.message}`);
        }
      }
      throw new BadRequestException('Failed to verify authentication. Please try again.');
    }

    const { uid, email, name, picture } = decodedToken;

    // Parse name into firstName/lastName if available
    const nameParts = name?.split(' ') || [];
    const firstName = dto.firstName || nameParts[0] || null;
    const lastName = dto.lastName || nameParts.slice(1).join(' ') || null;

    // Upsert user in database
    return await this.prisma.user.upsert({
      where: { id: uid },
      update: {
        firstName: firstName,
        lastName: lastName,
        avatar: picture || null,
        birthDay: dto.birthDay,
        birthMonth: dto.birthMonth,
        birthYear: dto.birthYear,
        country: dto.country,
        countryCode: dto.countryCode,
        city: dto.city,
      },
      create: {
        id: uid,
        email: email || '',
        firstName: firstName,
        lastName: lastName,
        avatar: picture || null,
        birthDay: dto.birthDay,
        birthMonth: dto.birthMonth,
        birthYear: dto.birthYear,
        country: dto.country,
        countryCode: dto.countryCode,
        city: dto.city,
        role: 'SENDER',
        isVerified: true, // Social login users are pre-verified
      },
    });
  }

  /**
   * Generate and store verification code for email
   */
  async generateVerificationCode(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Store with 10-minute expiry
    verificationCodes.set(normalizedEmail, {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // TODO: Send email with code
    // For now, log it (in production, use email service)
    console.log(`Verification code for ${normalizedEmail}: ${code}`);

    return code;
  }

  /**
   * Verify email with code
   */
  async verifyEmail(email: string, code: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const stored = verificationCodes.get(normalizedEmail);

    if (!stored) {
      throw new BadRequestException('No verification code found for this email');
    }

    if (new Date() > stored.expiresAt) {
      verificationCodes.delete(normalizedEmail);
      throw new BadRequestException('Verification code has expired');
    }

    // For testing: accept "0000" as valid code
    if (code === '0000' || stored.code === code) {
      verificationCodes.delete(normalizedEmail);

      // Note: isVerified will be set true through a separate verification flow
      // (e.g., ID verification, phone verification, admin approval)
      // Email code verification just confirms they have access to the email

      return true;
    }

    throw new BadRequestException('Invalid verification code');
  }

  /**
   * Check if email is already registered
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    return !!user;
  }

  /**
   * Get user by Firebase UID
   */
  async getUserById(uid: string) {
    return this.prisma.user.findUnique({
      where: { id: uid },
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  /**
   * Update user profile
   */
  async updateUser(uid: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: uid },
      data: dto,
    });
  }

  /**
   * Update user role
   */
  async updateUserRole(uid: string, role: 'SENDER' | 'COURIER') {
    return this.prisma.user.update({
      where: { id: uid },
      data: { role },
    });
  }
}
