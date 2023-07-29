import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  password: string;
}

export class LoginDto extends ForgotPasswordDto {
  @IsString()
  password: string;
}

export class PasswordResetCode {
  @IsString()
  @Length(6, 6)
  code: string;

  @IsUUID()
  id: string;
}
