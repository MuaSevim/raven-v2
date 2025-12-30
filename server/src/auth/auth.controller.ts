import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Headers,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import {
  CreateUserDto,
  SyncUserDto,
  UpdateUserDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register a new user with email/password
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const user = await this.authService.registerUser(dto);
    
    // Generate verification code
    await this.authService.generateVerificationCode(dto.email);

    return {
      message: 'User registered. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Check if email already exists
   * GET /auth/check-email?email=test@example.com
   */
  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    const exists = await this.authService.checkEmailExists(email);
    return { exists };
  }

  /**
   * Send verification code to email
   * POST /auth/send-code
   */
  @Post('send-code')
  async sendCode(@Body('email') email: string) {
    await this.authService.generateVerificationCode(email);
    return { message: 'Verification code sent' };
  }

  /**
   * Verify email with code
   * POST /auth/verify
   */
  @Post('verify')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const verified = await this.authService.verifyEmail(dto.email, dto.code);
    return { verified, message: 'Email verified successfully' };
  }

  /**
   * Sync user from Firebase (for social logins)
   * POST /auth/sync
   */
  @Post('sync')
  async syncUser(@Body() dto: SyncUserDto) {
    const user = await this.authService.syncUser(dto);

    return {
      message: 'User synced successfully',
      user,
    };
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.uid);
    return { user };
  }

  /**
   * Update current user profile
   * PUT /auth/me
   */
  @Put('me')
  @UseGuards(FirebaseAuthGuard)
  async updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    const user = await this.authService.updateUser(req.user.uid, dto);
    return { user };
  }
}
