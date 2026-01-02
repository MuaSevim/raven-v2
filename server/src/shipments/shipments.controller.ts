import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('shipments')
@UseGuards(FirebaseAuthGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) { }

  @Post()
  create(@Request() req, @Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentsService.create(req.user.uid, req.user.email, createShipmentDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('originCountry') originCountry?: string,
    @Query('destCountry') destCountry?: string,
    @Query('minWeight') minWeight?: string,
    @Query('maxWeight') maxWeight?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    console.log('GET /shipments findAll called with params:', {
      status,
      originCountry,
      destCountry,
      minWeight,
      maxWeight,
      minPrice,
      maxPrice,
    });
    return this.shipmentsService.findAll({
      status,
      originCountry,
      destCountry,
      minWeight: minWeight ? parseFloat(minWeight) : undefined,
      maxWeight: maxWeight ? parseFloat(maxWeight) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  }

  @Get('my/sent')
  findMySent(@Request() req) {
    return this.shipmentsService.findByUser(req.user.uid, 'sender');
  }

  @Get('my/delivering')
  findMyDelivering(@Request() req) {
    return this.shipmentsService.findByUser(req.user.uid, 'courier');
  }

  @Get('my/offers')
  findMyOffers(@Request() req) {
    return this.shipmentsService.findOffersByUser(req.user.uid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.shipmentsService.updateStatus(id, req.user.uid, status);
  }

  // Offers
  @Post(':id/offers')
  createOffer(
    @Request() req,
    @Param('id') id: string,
    @Body() createOfferDto: CreateOfferDto,
  ) {
    return this.shipmentsService.createOffer(id, req.user.uid, createOfferDto);
  }

  @Patch('offers/:offerId/accept')
  acceptOffer(@Request() req, @Param('offerId') offerId: string) {
    return this.shipmentsService.acceptOffer(offerId, req.user.uid);
  }

  @Patch('offers/:offerId/reject')
  rejectOffer(@Request() req, @Param('offerId') offerId: string) {
    return this.shipmentsService.rejectOffer(offerId, req.user.uid);
  }

  @Get(':id/my-offer')
  getMyOffer(@Request() req, @Param('id') id: string) {
    return this.shipmentsService.getUserOfferOnShipment(id, req.user.uid);
  }
}
