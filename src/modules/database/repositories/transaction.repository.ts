import { Brackets, DataSource, In, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { TransactionEntity } from '../entities/transaction.entity';
import { IParsedTransaction } from '@/blockchain/services/solana.service';

export class TransactionRepository extends Repository<TransactionEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(TransactionEntity, dataSource.createEntityManager());
  }

  convertParsedTransactionToEntity(
    transaction: IParsedTransaction,
  ): Partial<TransactionEntity> {
    return {
      signature: transaction.txHash,
      block_time: transaction.blockUnixTime,
      signer: transaction.signer,
      // tx_type: transaction.txType as ETxType,
      side: transaction.side,
      from_address: transaction?.from?.address,
      to_address: transaction?.to?.address,
      from_ui_amount: transaction?.from?.uiAmount,
      to_ui_amount: transaction?.to?.uiAmount,
      solana_price: transaction?.solanaPrice,
    };
  }

  convertEntityToParsedTransaction(
    transaction: TransactionEntity,
  ): IParsedTransaction {
    return {
      txHash: transaction.signature,
      signer: transaction.signer,
      blockUnixTime: transaction.block_time,
      // txType: transaction.tx_type,
      side: transaction.side,
      solanaPrice: transaction.solana_price,
      from: {
        address: transaction.from_address,
        uiAmount: transaction.from_ui_amount,
      },
      to: {
        address: transaction.to_address,
        uiAmount: transaction.to_ui_amount,
      },
    };
  }
  async upsertParsedTransactions(transactions: IParsedTransaction[]) {
    await this.upsert(
      transactions.map((transaction) =>
        this.convertParsedTransactionToEntity(transaction),
      ),
      { conflictPaths: ['signature'] },
    );
  }
  async getParsedTransactionsBySignatures(
    signatures: string[],
  ): Promise<IParsedTransaction[]> {
    const transactions = await this.find({
      where: {
        signature: In(signatures),
      },
      order: {
        block_time: 'DESC',
      },
      take: 1000,
    });
    return transactions.map((transaction) =>
      this.convertEntityToParsedTransaction(transaction),
    );
  }

  async getParsedTransactionsBySigner(
    signer: string,
    tokenAddress?: string,
  ): Promise<IParsedTransaction[]> {
    const transactionsQuery = this.createQueryBuilder('transactions')
      .where('transactions.signer = :signer', { signer })
      .select([
        'transactions.signature',
        'transactions.signer',
        'transactions.block_time',
        // 'tx_type',
        'transactions.side',
        'transactions.from_address',
        'transactions.to_address',
        'transactions.from_ui_amount',
        'transactions.to_ui_amount',
        'transactions.solana_price',
      ])
      .orderBy('block_time', 'DESC')
      .limit(1000);
    if (tokenAddress) {
      transactionsQuery.where(
        new Brackets((qr) => {
          qr.where('transactions.from_address = :token_address', {
            token_address: tokenAddress,
          }).orWhere('transactions.to_address = :token_address', {
            token_address: tokenAddress,
          });
        }),
      );
    }
    const transactions = await transactionsQuery.getMany();
    return transactions.map((transaction) =>
      this.convertEntityToParsedTransaction(transaction),
    );
  }

  async getLastestTransaction(signer: string) {
    return this.createQueryBuilder('transactions')
      .where('transactions.signer = :signer', { signer })
      .orderBy('transactions.block_time', 'DESC')
      .limit(1)
      .getOne();
  }
}
