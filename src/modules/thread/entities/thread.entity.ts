import { IsOptional, IsString } from 'class-validator';
import { BaseEntityWithCreators } from 'src/lib/base.entity';
import { Inbox } from 'src/modules/inbox/entities/inbox.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { ThreadTypeEnum } from '../dto/enum';
import { getValue } from 'express-ctx';

@Entity()
export class Thread extends BaseEntityWithCreators {
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

  // thread WITH a code indicates a private chat or a request
  // thread WITHOUT a code indicates a group chat
  @Column('text', { nullable: true, unique: true })
  code?: string;

  @Column({
    type: 'enum',
    enum: ThreadTypeEnum,
    default: ThreadTypeEnum.Private,
  })
  type: ThreadTypeEnum;

  @Column('simple-json', { default: {} })
  unreadCountByUsers: Record<string, number>;

  @BeforeInsert()
  readByUsers?() {
    const user: User = getValue('user');
    const threadUsers = this.users;
    const unreadCount = {};
    threadUsers.forEach((usr) => {
      unreadCount[usr.id] = 1;
    });
    unreadCount[user.id] = 0;
    this.unreadCountByUsers = unreadCount;
  }
}
