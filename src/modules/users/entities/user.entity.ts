import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

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

  @ManyToMany(() => User, (user) => user.blockedUsers)
  @JoinTable({
    name: 'users_blocked_list',
    joinColumn: { name: 'userId' },
    inverseJoinColumn: { name: 'blocked_userId' },
  })
  blockedUsers: User[];

  @ManyToMany(() => User, (user) => user.chatRequests)
  @JoinTable({
    name: 'users_chat_requests',
    joinColumn: { name: 'senderId' },
    inverseJoinColumn: { name: 'receiverId' },
  })
  chatRequests: User[];
}
