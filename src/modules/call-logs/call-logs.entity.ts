import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { IsOptional, IsUUID } from 'class-validator';
import { CallLogType } from './enum';

@Entity()
export class CallLog extends BaseEntity {
  @IsOptional()
  @Column({ type: 'int', default: 0 })
  duration?: number;

  @Column({ type: 'text' })
  type: CallLogType;

  @IsUUID('4')
  @Column({ type: 'uuid' })
  callFromId: string;

  @IsUUID('4')
  @Column({ type: 'uuid' })
  callToId: string;

  @ManyToOne(() => User)
  callFrom: User;

  @ManyToOne(() => User)
  callTo: User;
}
