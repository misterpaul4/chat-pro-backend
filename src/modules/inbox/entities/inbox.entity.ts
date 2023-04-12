import { BaseEntity } from 'src/lib/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Inbox extends BaseEntity {
  @Column()
  message: string;

  @Column({ type: 'boolean' })
  starred: boolean;

  @ManyToOne(() => User)
  sender: User;

  @Column()
  senderId: string;

  @ManyToOne(() => User)
  receiver: User;

  @Column()
  receiverId: string;
}
