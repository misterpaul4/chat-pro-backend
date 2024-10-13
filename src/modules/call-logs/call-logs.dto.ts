import { IsBoolean, IsNumber, IsOptional, IsUUID } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  declined?: boolean;
}
