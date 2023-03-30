import { IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Request extends BaseEntity {
  @ManyToOne(() => User)
  sender: User;

  @Column()
  senderId: string;

  @ManyToOne(() => User)
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
