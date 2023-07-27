import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class LoginDto extends ForgotPasswordDto {
  @IsString()
  password: string;
}
