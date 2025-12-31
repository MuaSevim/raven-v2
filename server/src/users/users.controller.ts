import {
    Controller,
    Get,
    Param,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Get public profile for a user
     */
    @Get(':id/profile')
    getPublicProfile(@Param('id') id: string) {
        return this.usersService.getPublicProfile(id);
    }
}
