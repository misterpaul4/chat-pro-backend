import { IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Inbox } from 'src/modules/inbox/entities/inbox.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

@Entity()
export class Thread extends BaseEntity {
  @ManyToMany(() => User, (user) => user.threads, { cascade: true })
  @JoinTable()
  users: User[];

  @OneToMany(() => Inbox, (messages) => messages.thread)
  messages: Inbox[];

  @Column('text', { default: '' })
  title: string;

  @IsString()
  @IsOptional()
  @Column('text', { nullable: true })
  description?: string;

  // thread WITH a code indicates a private chat
  // thread WITHOUT a code indicates a group chat
  @Column('text', { nullable: true })
  code?: string;

  @Column('boolean', { default: false })
  group: boolean;
}
