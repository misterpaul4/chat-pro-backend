import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { Blocklist } from 'src/modules/blocklist/entities/blocklist.entity';
import { Request } from 'src/modules/requests/entities/request.entity';
import { Column, Entity, OneToMany } from 'typeorm';

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

  @OneToMany(() => Blocklist, (blocklist) => blocklist.user)
  blockList: Blocklist[];
}
