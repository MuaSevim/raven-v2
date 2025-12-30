import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { TravelsService } from './travels.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('travels')
@UseGuards(FirebaseAuthGuard)
export class TravelsController {
  constructor(private readonly travelsService: TravelsService) {}

  @Post()
  create(
    @Request() req,
    @Body() createTravelDto: CreateTravelDto,
  ) {
    return this.travelsService.create(req.user.uid, req.user.email, createTravelDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('fromCity') fromCity?: string,
    @Query('toCity') toCity?: string,
    @Query('minWeight') minWeight?: string,
    @Query('maxWeight') maxWeight?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.travelsService.findAll({
      status,
      fromCity,
      toCity,
      minWeight: minWeight ? parseFloat(minWeight) : undefined,
      maxWeight: maxWeight ? parseFloat(maxWeight) : undefined,
      fromDate,
      toDate,
    });
  }

  @Get('my')
  findMyTravels(@Request() req) {
    return this.travelsService.findByUser(req.user.uid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.travelsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTravelDto: UpdateTravelDto,
  ) {
    return this.travelsService.update(id, req.user.uid, updateTravelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.travelsService.remove(id, req.user.uid);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Request() req) {
    return this.travelsService.cancel(id, req.user.uid);
  }
}
