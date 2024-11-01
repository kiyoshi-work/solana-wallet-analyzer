import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Unique(['user_address', 'token_address'])
@Entity('gain')
export class GainEntity extends BaseEntity {
  @Column()
  user_address: string;

  @Column()
  token_address: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ type: 'float', nullable: true })
  pnl: number;

  @Column({ type: 'float', nullable: true })
  pnl_percent: number;

  @Column({ type: 'float', nullable: true })
  bought_at_mcc: number;
  @Column({ type: 'float', nullable: true })
  sold_at_mcc: number;
  @Column({ type: 'float', nullable: true })
  hold_time: number;
  @Column({ type: 'float', nullable: true })
  total_buy_token: number;
  @Column({ type: 'float', nullable: true })
  total_buy_solana: number;
  @Column({ type: 'float', nullable: true })
  total_sell_token: number;
  @Column({ type: 'float', nullable: true })
  total_sell_solana: number;
  @Column({ type: 'float', nullable: true })
  avg_sell_price: number;
  @Column({ type: 'float', nullable: true })
  avg_buy_price: number;

  @Column({ nullable: true })
  num_buy: number;
  @Column({ type: 'float', nullable: true })
  mean_buy: number;
  @Column({ type: 'float', nullable: true })
  stdev_buy: number;
  @Column({ nullable: true })
  num_sell: number;
  @Column({ type: 'float', nullable: true })
  mean_sell: number;
  @Column({ type: 'float', nullable: true })
  stdev_sell: number;
  @Column({ nullable: true })
  latest_sell: Date;
  @Column({ nullable: true })
  earliest_buy: Date;
}
