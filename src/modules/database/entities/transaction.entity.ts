import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

// export enum ETxType {
//   Swap = 'swap',
// }
@Entity('transactions')
export class TransactionEntity extends BaseEntity {
  @Column({
    unique: true,
  })
  @Index()
  signature: string;

  @Column()
  @Index()
  signer: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'block time',
  })
  @Index()
  block_time: Date;

  //   @Column({
  //     // type: 'enum',
  //     enum: ETxType,
  //     default: ETxType.Swap,
  //   })
  //   tx_type: ETxType;

  @Column()
  side: 'buy' | 'sell';

  @Column({
    nullable: false,
  })
  from_address: string;

  @Column({
    type: 'float',
    nullable: true,
  })
  from_ui_amount: number;

  @Column({
    nullable: false,
  })
  to_address: string;

  @Column({
    type: 'float',
    nullable: true,
  })
  to_ui_amount: number;

  @Column({
    type: 'float',
    nullable: true,
  })
  solana_price: number;

  @Column({ default: false })
  @Index()
  recheck: boolean;

  //   @Column({
  //     type: 'jsonb',
  //     nullable: true,
  //     comment: 'Transaction data',
  //   })
  //   values: Record<string, any>;
}
