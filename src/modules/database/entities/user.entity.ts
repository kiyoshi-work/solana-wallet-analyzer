import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true, nullable: true })
  address: string;
}
