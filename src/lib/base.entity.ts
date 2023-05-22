import { getValue } from 'express-ctx';
import { User } from 'src/modules/users/entities/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
export class BaseEntityWithCreators extends BaseEntity {
  @BeforeInsert()
  updateCreatedBy?() {
    const user: User = getValue('user');
    this.createdBy = user.id;
  }

  @BeforeUpdate()
  updateUpdatedBy?() {
    const user: User = getValue('user');
    this.updatedBy = user.id;
  }

  @Column('text', { nullable: true, default: 'System' })
  createdBy?: string;

  @Column('text', { nullable: true, default: 'System' })
  updatedBy?: string;
}
