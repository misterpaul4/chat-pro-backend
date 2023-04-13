import { IsBoolean } from 'class-validator';

export class UpdateInboxDto {
  @IsBoolean()
  read?: boolean;
}
