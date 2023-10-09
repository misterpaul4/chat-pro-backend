import { IsString } from 'class-validator';
import { BaseEntityWithCreators } from 'src/lib/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

@Entity()
export class AuthProviders extends BaseEntityWithCreators {
  @IsString()
  @Index()
  @Column()
  providerId: string;

  @IsString()
  @Column()
  name: string;

  @Column('jsonb', { default: {} })
  extraData?: Record<string, any>;

  @Column({ type: 'uuid' })
  @Index()
  userId?: string;

  @ManyToOne(() => User, (user) => user.authProviders, { onDelete: 'CASCADE' })
  user?: User;
}
