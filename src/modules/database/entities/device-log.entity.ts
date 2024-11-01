import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Unique(['address', 'ip'])
@Entity('device_logs')
export class DeviceLogEntity extends BaseEntity {
  @Column()
  address: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  num_request: number;
}
