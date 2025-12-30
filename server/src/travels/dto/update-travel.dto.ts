import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class UpdateTravelDto {
  @IsOptional()
  @IsString()
  fromCountry?: string;

  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  fromAirport?: string;

  @IsOptional()
  @IsString()
  fromAirportCode?: string;

  @IsOptional()
  @IsString()
  toCountry?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsString()
  toAirport?: string;

  @IsOptional()
  @IsString()
  toAirportCode?: string;

  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  availableWeight?: number;

  @IsOptional()
  @IsString()
  weightUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerKg?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  flightNumber?: string;
}
