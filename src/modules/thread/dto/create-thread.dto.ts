import { Type } from 'class-transformer';
import { IsObject, IsUUID, ValidateNested } from 'class-validator';
import { CreateInboxDto } from 'src/modules/inbox/dto/create-inbox.dto';

export class CreatePrivateThreadDto {
  @IsUUID('4')
  receiverId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CreateInboxDto)
  inbox: CreateInboxDto;
}
