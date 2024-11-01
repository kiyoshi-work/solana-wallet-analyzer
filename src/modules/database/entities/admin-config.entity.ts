import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('admin-configs')
export class AdminConfigEntity extends BaseEntity {
  @Column({ unique: true })
  @Index()
  key: string;

  @Column({ nullable: true })
  value?: string;

  @Column({ type: 'simple-json', nullable: true })
  data: any;
}
