import { Controller, Post, Get, UseGuards, Req, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sync')
  @UseGuards(FirebaseAuthGuard)
  async syncUser(@Headers('authorization') authHeader: string) {
    const token = authHeader.split('Bearer ')[1];
    const user = await this.authService.syncUser(token);

    return {
      message: 'User synced successfully',
      user,
    };
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.uid);
    return { user };
  }
}
