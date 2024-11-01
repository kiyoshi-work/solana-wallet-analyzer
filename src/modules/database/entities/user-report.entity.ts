import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Unique(['address', 'ip', 'token_address'])
@Entity('user_reports')
export class UserReportEntity extends BaseEntity {
  @Column()
  address: string;

  @Column({ nullable: true })
  ip: string;

  @Column()
  token_address: string;

  @Column({
    default: 0,
  })
  num_report: number;
}
