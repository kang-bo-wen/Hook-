import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @Length(6, 6)
  verificationCode!: string;

  @IsOptional()
  @IsString()
  nickname?: string;
}

export class SendEmailCodeDto {
  @IsEmail()
  email!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
