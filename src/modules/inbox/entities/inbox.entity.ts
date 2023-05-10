import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Thread } from 'src/modules/thread/entities/thread.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

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

  @IsString()
  @IsOptional()
  @Column({ nullable: true })
  replyingTo?: string;

  @Column({ type: 'boolean', default: false })
  read?: boolean;

  @ManyToOne(() => Thread, (thread) => thread.messages)
  thread: Thread;
}
