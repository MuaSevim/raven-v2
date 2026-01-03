import {
  IsEmail,
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsInt()
  @Min(1)
  @Max(31)
  birthDay: number;

  @IsInt()
  @Min(1)
  @Max(12)
  birthMonth: number;

  @IsInt()
  @Min(1900)
  @Max(2010) // Allow users 16+ years old
  birthYear: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class SyncUserDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsInt()
  birthDay?: number;

  @IsOptional()
  @IsInt()
  birthMonth?: number;

  @IsOptional()
  @IsInt()
  birthYear?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsInt()
  birthDay?: number;

  @IsOptional()
  @IsInt()
  birthMonth?: number;

  @IsOptional()
  @IsInt()
  birthYear?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  phoneCode?: string;

  @IsOptional()
  @IsIn(['SENDER', 'COURIER'])
  role?: 'SENDER' | 'COURIER';
}

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
