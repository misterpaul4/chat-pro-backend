import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from 'src/lib/base.entity';
import { StatusEnum } from '../dto/user-operations.dto';

@Unique(['receiverId', 'senderId'])
@Entity()
export class UserChatRequests extends BaseEntity {
  @Column()
  senderId: string;

  @ManyToOne(() => User, (sender) => sender.sentRequest)
  sender: User;

  @IsUUID()
  @Column()
  receiverId: string;

  @ManyToOne(() => User, (receiver) => receiver.receivedRequest)
  receiver: User;

  @IsString()
  @IsOptional()
  @Column({ nullable: true })
  message: string;

  @Column({ default: StatusEnum.Pending })
  status: string;
}
