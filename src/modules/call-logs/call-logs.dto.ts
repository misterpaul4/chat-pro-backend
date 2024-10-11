import { IsUUID } from 'class-validator';

export class MakeCallDto {
  @IsUUID('4')
  receiverId: string
}