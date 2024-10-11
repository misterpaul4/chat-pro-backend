import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { IsOptional, IsUUID } from 'class-validator';
import { CallLogStatus, CallLogType } from './enum';

@Entity()
export class CallLog extends BaseEntity {
  @IsOptional()
  @Column({ type: 'int', default: 0 })
  duration?: number;

  @Column({ type: 'text', default: CallLogType.Audio })
  type: CallLogType;

  @Index()
  @Column({ type: 'text', default: CallLogStatus.Pending })
  status: CallLogStatus;

  @IsUUID('4')
  @Index()
  @Column({ type: 'uuid' })
  callFromId: string;

  @IsUUID('4')
  @Index()
  @Column({ type: 'uuid' })
  callToId: string;

  @ManyToOne(() => User)
  callFrom: User;

  @ManyToOne(() => User)
  callTo: User;
}
