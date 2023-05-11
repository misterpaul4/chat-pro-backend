import { IsUUID } from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Inbox } from 'src/modules/inbox/entities/inbox.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

@Entity()
export class Thread extends BaseEntity {
  @ManyToMany(() => User, (user) => user.threads, { cascade: true })
  @JoinTable()
  users: User[];

  @OneToMany(() => Inbox, (messages) => messages.thread)
  messages: Inbox[];
}
