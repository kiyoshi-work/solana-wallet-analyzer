import { IParsedTransaction } from '@/blockchain/services/solana.service';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAME.PERSIST_DB)
    private persistQueue: Queue,
  ) {}

  async persistTokens(tokens: any[]) {
    await this.persistQueue.add(
      QUEUE_PROCESSOR.PERSIST_DB.TOKEN,
      {
        data: tokens,
      },
      {
        attempts: 2,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async persistTransactions(transactions: IParsedTransaction[]) {
    await this.persistQueue.add(
      QUEUE_PROCESSOR.PERSIST_DB.TRANSACTION,
      {
        data: transactions,
      },
      {
        attempts: 2,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async persistTokenPrices(
    address: string,
    tokenPrices: {
      price: number;
      time: Date;
    }[],
  ) {
    await this.persistQueue.add(
      QUEUE_PROCESSOR.PERSIST_DB.TOKEN_PRICE,
      {
        address: address,
        tokenPrices,
      },
      {
        attempts: 2,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
