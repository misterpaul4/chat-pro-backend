import { BaseEntity } from 'src/lib/base.entity';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { User } from './user.entity';

@Unique(['userId', 'contactId'])
@Entity()
export class UserContactList extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  contactId: string;

  @ManyToOne(() => User)
  contact: User;

  @Column({ type: 'boolean', default: false })
  favourite: boolean;

  @Column({ type: 'boolean', default: false })
  blocked: boolean;
}
