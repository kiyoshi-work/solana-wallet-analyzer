import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('tokens')
export class TokenEntity extends BaseEntity {
  @Column({ unique: true, nullable: true })
  @Index()
  address: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  @Index()
  symbol: string;

  @Column({ nullable: true })
  decimals: number;

  @Column({ nullable: true })
  logoURI: string;

  @Column({ type: 'double precision', nullable: true })
  supply: number;

  @Column({ type: 'simple-json', nullable: true })
  social_link: any;
}
