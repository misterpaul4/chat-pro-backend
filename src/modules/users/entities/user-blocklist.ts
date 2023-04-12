import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { User } from './user.entity';

@Unique(['userId', 'blockedUserId'])
@Entity()
export class UserBlockList extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  blockedUserId: string;

  @ManyToOne(() => User)
  blockedUser: User;
}
