import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { CreateInboxDto } from 'src/modules/inbox/dto/create-inbox.dto';

export class MessageDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CreateInboxDto)
  inbox: CreateInboxDto;
}
