import { IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Request extends BaseEntity {
  @ManyToOne(() => User, (user) => user.sentRequests, {
    onDelete: 'CASCADE',
  })
  sender: User;

  @Column()
  senderId: string;

  @ManyToOne(() => User, (user) => user.receivedRequests, {
    onDelete: 'CASCADE',
  })
  receiver: User;

  @IsString()
  @Column()
  receiverId: string;

  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  comment?: string;

  @Column({ default: false, type: 'boolean' })
  accepted: boolean;
}
