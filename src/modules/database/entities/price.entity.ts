import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('prices')
export class PriceEntity {
  @Column({ type: 'text', nullable: false })
  // @Column({ type: 'varchar', length: 32, nullable: false })
  @Index()
  symbol: string;

  @Column('double precision')
  // { precision: 10, scale: 2 }
  price: number;

  @PrimaryColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  time: Date;
}
