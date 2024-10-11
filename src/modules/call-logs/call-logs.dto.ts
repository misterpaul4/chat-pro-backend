import { IsNumber, IsUUID } from 'class-validator';

export class MakeCallDto {
  @IsUUID('4')
  receiverId: string;
}

export class EndCallDto {
  @IsUUID('4')
  receiverId: string;

  @IsNumber()
  duration: number;
}
