import { IsEmail, IsString, Length } from 'class-validator';

export class EmailChangeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

export class EmailChangeRequestDto {
  @IsEmail()
  email: string;
}
