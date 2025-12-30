import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AddPaymentMethodDto, HoldPaymentDto } from './dto/payment.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('payments')
@UseGuards(FirebaseAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Add a payment method
   */
  @Post('methods')
  addPaymentMethod(@Request() req, @Body() dto: AddPaymentMethodDto) {
    return this.paymentsService.addPaymentMethod(req.user.uid, dto);
  }

  /**
   * Get all payment methods
   */
  @Get('methods')
  getPaymentMethods(@Request() req) {
    return this.paymentsService.getPaymentMethods(req.user.uid);
  }

  /**
   * Set payment method as default
   */
  @Patch('methods/:id/default')
  setDefaultPaymentMethod(@Request() req, @Param('id') id: string) {
    return this.paymentsService.setDefaultPaymentMethod(req.user.uid, id);
  }

  /**
   * Delete a payment method
   */
  @Delete('methods/:id')
  deletePaymentMethod(@Request() req, @Param('id') id: string) {
    return this.paymentsService.deletePaymentMethod(req.user.uid, id);
  }

  /**
   * Hold payment for matching
   */
  @Post('hold')
  holdPayment(@Request() req, @Body() dto: HoldPaymentDto) {
    return this.paymentsService.holdPayment(req.user.uid, dto);
  }

  /**
   * Release payment to courier
   */
  @Post('release/:shipmentId')
  releasePayment(@Request() req, @Param('shipmentId') shipmentId: string) {
    return this.paymentsService.releasePayment(req.user.uid, shipmentId);
  }

  /**
   * Refund payment
   */
  @Post('refund/:shipmentId')
  refundPayment(@Request() req, @Param('shipmentId') shipmentId: string) {
    return this.paymentsService.refundPayment(req.user.uid, shipmentId);
  }

  /**
   * Get user transactions
   */
  @Get('transactions')
  getUserTransactions(@Request() req) {
    return this.paymentsService.getUserTransactions(req.user.uid);
  }
}
