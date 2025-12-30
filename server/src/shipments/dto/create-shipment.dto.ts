import { IsString, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateShipmentDto {
  // Route - Origin
  @IsString()
  originCountry: string;

  @IsString()
  originCity: string;

  @IsOptional()
  @IsString()
  originAddress?: string;

  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @IsOptional()
  @IsNumber()
  meetingPointLat?: number;

  @IsOptional()
  @IsNumber()
  meetingPointLng?: number;

  // Route - Destination
  @IsString()
  destCountry: string;

  @IsString()
  destCity: string;

  @IsOptional()
  @IsString()
  destAddress?: string;



  // Package Details
  @IsNumber()
  @Min(0.1)
  @Max(50)
  weight: number;

  @IsOptional()
  @IsString()
  weightUnit?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  packageType?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  // Delivery Window
  @IsDateString()
  dateStart: string;

  @IsDateString()
  dateEnd: string;

  // Pricing
  @IsNumber()
  @Min(1)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  // Sender Details
  @IsOptional()
  @IsString()
  senderFullName?: string;

  @IsOptional()
  @IsString()
  senderIdNumber?: string;

  @IsOptional()
  @IsNumber()
  senderAge?: number;

  @IsOptional()
  @IsString()
  senderPhone?: string;

  @IsOptional()
  @IsString()
  senderPhoneCode?: string;
}
