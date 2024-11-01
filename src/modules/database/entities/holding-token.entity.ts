import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Unique(['user_address', 'token_address'])
@Entity('holding_tokens')
export class HoldingTokenEntity extends BaseEntity {
  @Column({ nullable: false })
  @Index()
  user_address: string;

  @Column({ nullable: false })
  @Index()
  token_address: string;

  @Column({ nullable: true })
  @Index()
  symbol: string;

  @Column({ type: 'double precision', nullable: true })
  balance: number;
}
