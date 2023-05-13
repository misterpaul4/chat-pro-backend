import { Type } from 'class-transformer';
import { IsEmpty, IsObject, ValidateNested } from 'class-validator';
import { CreateInboxDto } from 'src/modules/inbox/dto/create-inbox.dto';

class IInboxDto extends CreateInboxDto {
  @IsEmpty()
  threadId: string;

  @IsEmpty()
  replyingTo?: string;
}

export class MessageDto {
  @IsObject()
  @ValidateNested()
  @Type(() => IInboxDto)
  inbox: IInboxDto;
}
