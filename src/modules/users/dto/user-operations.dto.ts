import { IsUUID } from 'class-validator';

export class BlockUserDto {
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class IdDto {
  @IsUUID('4')
  id: string;
}

export enum StatusEnum {
  Pending = 'Pending',
  Approved = 'Approved',
}
