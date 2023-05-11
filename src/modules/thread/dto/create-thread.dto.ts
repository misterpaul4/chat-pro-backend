import { Type } from 'class-transformer';
import { IsObject, IsUUID, ValidateNested } from 'class-validator';
import { CreateInboxDto } from 'src/modules/inbox/dto/create-inbox.dto';

export class CreateThreadDto {
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => CreateInboxDto)
  inbox: CreateInboxDto;
}
