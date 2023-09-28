import { Type } from 'class-transformer';
import { IsEmpty, IsObject, IsUUID, ValidateNested } from 'class-validator';
import { CreateInboxDto } from 'src/modules/inbox/dto/create-inbox.dto';
import { IMessageReply } from 'src/modules/inbox/dto/index.dto';

class IInboxDto extends CreateInboxDto {
  @IsEmpty()
  threadId: string;

  @IsEmpty()
  replyingTo?: IMessageReply;
}

export class MessageDto {
  @IsObject()
  @ValidateNested()
  @Type(() => IInboxDto)
  inbox: IInboxDto;
}

export class ReadMessage {
  @IsUUID('4')
  threadId: string;
}
