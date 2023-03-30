import { IsOptional, IsString } from 'class-validator';
import { BaseEntity } from 'src/lib/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Blocklist extends BaseEntity {
  @ManyToOne(() => User, (user) => user.blockList, { onDelete: 'CASCADE' })
  user: User;

  @IsString()
  @IsOptional()
  @Column({ nullable: true })
  comment?: string;
}
