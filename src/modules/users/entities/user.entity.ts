import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserChatRequests } from './user-chat-requests';
import { UserBlockList } from './user-blocklist';
import { UserContactList } from './user-contactlist';
import { Inbox } from 'src/modules/inbox/entities/inbox.entity';

@Entity()
export class User extends BaseEntity {
  @IsEmail()
  @Column({ unique: true })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password is weak',
  })
  @Column()
  password: string;

  @IsString()
  @Column()
  firstName: string;

  @IsString()
  @Column()
  lastName: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  middleName: string;

  @OneToMany(() => UserBlockList, (blockedUsers) => blockedUsers.user)
  blockedUsers: UserBlockList[];

  @OneToMany(() => UserChatRequests, (sentRequest) => sentRequest.sender)
  sentRequest: User[];

  @OneToMany(
    () => UserChatRequests,
    (receivedRequest) => receivedRequest.receiver,
  )
  receivedRequest: User[];

  @OneToMany(() => UserContactList, (contacts) => contacts.user)
  contacts: UserContactList[];

  @OneToMany(() => Inbox, (sentMessages) => sentMessages.sender)
  sentMessages: Inbox[];

  @OneToMany(() => Inbox, (receivedMessages) => receivedMessages.receiver)
  receivedMessages: Inbox[];
}
