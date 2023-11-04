import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

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

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'newPassword is weak',
  })
  newPassword: string;

  @IsString()
  @IsOptional()
  oldPassword: string;
}
