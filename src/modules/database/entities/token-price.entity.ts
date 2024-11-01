import { Entity, Column, Index, PrimaryColumn } from 'typeorm';
@Entity('token_price')
export class TokenPriceEntity {
  @Column({ type: 'text', nullable: false })
  @Index()
  address: string;

  @Column('double precision')
  price: number;

  @PrimaryColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  time: Date;
}
