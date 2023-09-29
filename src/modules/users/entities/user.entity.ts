import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, Index, ManyToMany, OneToMany } from 'typeorm';
import { UserContactList } from './user-contactlist';
import { Thread } from 'src/modules/thread/entities/thread.entity';

@Entity()
export class User extends BaseEntity {
  @IsEmail()
  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastEmailChangeDate: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  lastPasswordChangeDate: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  lastSeen: Date;

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

  @Column({ nullable: true })
  verifCode: string;

  @Column({ nullable: true, type: 'timestamptz' })
  verifCodeCreatedAt: Date;

  @OneToMany(() => UserContactList, (contacts) => contacts.user)
  contacts: UserContactList[];

  @ManyToMany(() => Thread, (thread) => thread.users)
  threads: Thread;
}
