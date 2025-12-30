import { Module } from '@nestjs/common';
import { TravelsService } from './travels.service';
import { TravelsController } from './travels.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TravelsController],
  providers: [TravelsService],
  exports: [TravelsService],
})
export class TravelsModule {}
