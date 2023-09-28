import { IsOptional, IsUUID } from 'class-validator';
import { Inbox } from '../entities/inbox.entity';

export class CreateInboxDto extends Inbox {
  @IsUUID('4')
  @IsOptional()
  updateId: string;
}
