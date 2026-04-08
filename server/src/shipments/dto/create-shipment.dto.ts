import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, IsEnum } from 'class-validator';
import { PackageType } from '@prisma/client';

export class CreateShipmentDto {
  // Route - Origin
  @IsString()
  originCountry: string;

  @IsString()
  originCity: string;

  @IsOptional()
  @IsString()
  originAddress?: string;

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
  @IsEnum(PackageType)
  packageType?: PackageType;

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
  // Legacy frontend field kept for compatibility and ignored by persistence layer.
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
