import { IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { CallLogStatus } from './enum';

export class MakeCallDto {
  @IsUUID('4')
  receiverId: string;

  @IsUUID('4')
  sessionId: string;
}

export class EndCallDto {
  @IsUUID('4')
  sessionId: string;

  @IsNumber()
  duration: number;

  @IsEnum(CallLogStatus)
  @IsOptional()
  status: CallLogStatus;
}
