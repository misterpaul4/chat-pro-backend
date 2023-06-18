import { IsBoolean, IsEmail, IsOptional, IsUUID } from 'class-validator';
import { UserContactList } from '../entities/user-contactlist';

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

export class UpdateContactsDto extends UserContactList {
  @IsUUID('4', { each: true })
  contactIds: string[];
}

export class TypingDto {
  @IsBoolean()
  isTyping: boolean;

  @IsUUID()
  threadId: string;
}

export interface IThreadUsers {
  threadId: string;
  userId: string;
}
