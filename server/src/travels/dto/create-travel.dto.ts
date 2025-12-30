import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateTravelDto {
  @IsString()
  fromCountry: string;

  @IsString()
  fromCity: string;

  @IsOptional()
  @IsString()
  fromAirport?: string;

  @IsOptional()
  @IsString()
  fromAirportCode?: string;

  @IsString()
  toCountry: string;

  @IsString()
  toCity: string;

  @IsOptional()
  @IsString()
  toAirport?: string;

  @IsOptional()
  @IsString()
  toAirportCode?: string;

  @IsDateString()
  departureDate: string;

  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @IsNumber()
  @Min(0.1)
  availableWeight: number;

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
