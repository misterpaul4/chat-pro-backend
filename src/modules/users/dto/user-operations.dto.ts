import { IsUUID } from 'class-validator';

export class BlockUserDto {
  @IsUUID('4', { each: true })
  userIds: string[];
}
