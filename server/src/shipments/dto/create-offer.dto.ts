import { IsString, MinLength } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  @MinLength(10)
  message: string;
}
