import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { UserChatRequests } from './user-chat-requests';
import { UserContactList } from './user-contactlist';
import { Thread } from 'src/modules/thread/entities/thread.entity';

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

  @OneToMany(() => UserChatRequests, (sentRequest) => sentRequest.sender)
  sentRequest: User[];

  @OneToMany(
    () => UserChatRequests,
    (receivedRequest) => receivedRequest.receiver,
  )
  receivedRequest: User[];

  @OneToMany(() => UserContactList, (contacts) => contacts.user)
  contacts: UserContactList[];

  @ManyToMany(() => Thread, (thread) => thread.users)
  threads: Thread;
}
