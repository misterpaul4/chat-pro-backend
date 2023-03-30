import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Request } from 'src/modules/requests/entities/request.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

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

  @OneToMany(() => Request, (requests) => requests.sender)
  sentRequests: Request[];

  @OneToMany(() => Request, (requests) => requests.receiver)
  receivedRequests: Request[];

  @ManyToMany(() => User, (user) => user.blockedUsers)
  @JoinTable({
    name: 'users_blocked_list',
    joinColumn: { name: 'userId' },
    inverseJoinColumn: { name: 'blocked_userId' },
  })
  blockedUsers: User[];
}
