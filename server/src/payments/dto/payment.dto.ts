import { IsString, IsInt, IsBoolean, IsOptional, Min, Max, Length } from 'class-validator';

export class AddPaymentMethodDto {
  @IsString()
  cardNumber: string; // In production, this would be a Stripe token

  @IsString()
  cardHolder: string;

  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth: number;

  @IsInt()
  @Min(2024)
  expiryYear: number;

  @IsString()
  @Length(3, 4)
  cvv: string;

  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}

export class HoldPaymentDto {
  @IsString()
  shipmentId: string;

  @IsString()
  courierId: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
