import { IsBoolean, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class BlockUserDto {
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class IdDto {
  @IsUUID('4')
  id: string;
}

export class EmailDto {
  @IsEmail()
  email: string;
}

export enum StatusEnum {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export class AddContactDto {
  @IsUUID('3')
  contactId: string;

  @IsOptional()
  @IsBoolean()
  blocked?: boolean;
}
