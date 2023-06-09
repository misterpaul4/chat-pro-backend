import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { getValue } from 'express-ctx';
import { BaseEntity } from 'src/lib/base.entity';
import { Thread } from 'src/modules/thread/entities/thread.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { BeforeInsert, Column, Entity, ManyToOne } from 'typeorm';

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

  @Column({ type: 'simple-array' })
  readBy: string[];

  @ManyToOne(() => Thread, (thread) => thread.messages)
  thread: Thread;

  @Column()
  @IsUUID('4')
  threadId: string;

  @BeforeInsert()
  readByUser?() {
    const user: User = getValue('user');
    this.readBy = [user.id];
  }
}
