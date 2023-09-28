import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Thread } from 'src/modules/thread/entities/thread.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { IMessageReply } from '../dto/index.dto';

@Entity()
export class Inbox extends BaseEntity {
  @Column()
  @IsString()
  message: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  @IsOptional()
  starred: boolean;

  @ManyToOne(() => User)
  sender: User;

  @Column()
  senderId: string;

  @Column({ nullable: true, type: 'simple-json' })
  replyingTo?: IMessageReply;

  @IsOptional()
  @IsUUID()
  reply?: string;

  @ManyToOne(() => Thread, (thread) => thread.messages)
  thread: Thread;

  @Column()
  @IsUUID('4')
  threadId: string;
}
