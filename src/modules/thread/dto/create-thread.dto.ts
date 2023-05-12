import { IsUUID } from 'class-validator';
import { MessageDto } from './message.dto';

export class CreatePrivateThreadDto extends MessageDto {
  @IsUUID('4')
  receiverId: string;
}
