import { IParsedTransaction } from '@/blockchain/services/solana.service';
import {
  TokenPriceRepository,
  TokenRepository,
  TransactionRepository,
} from '@/database/repositories';
import { QUEUE_NAME, QUEUE_PROCESSOR } from '@/shared/constants/queue';
import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Processor(QUEUE_NAME.PERSIST_DB)
export class PersistConsumer {
  constructor(
    @InjectPinoLogger(PersistConsumer.name)
    private readonly logger: PinoLogger,
    private readonly tokenRepository: TokenRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly tokenPriceRepository: TokenPriceRepository,
  ) {}

  @Process(QUEUE_PROCESSOR.PERSIST_DB.TOKEN)
  async persistTokens(
    job: Job<{
      data: any[];
    }>,
  ) {
    const { data } = job.data;
    try {
      if (data?.length) {
        await this.tokenRepository.upsert(data, {
          conflictPaths: ['address'],
        });
        this.logger.info('tokens saved to db: ' + data.length);
      }
    } catch (error) {
      this.logger.error('upsert transactionsParsed failed', error);
      throw error;
    }
  }

  @Process(QUEUE_PROCESSOR.PERSIST_DB.TRANSACTION)
  async persistTransactions(
    job: Job<{
      data: IParsedTransaction[];
    }>,
  ) {
    const { data } = job.data;
    try {
      if (data?.length) {
        await this.transactionRepository.upsertParsedTransactions(data);
        this.logger.info('upsert transactionsParsed success');
      }
    } catch (error) {
      this.logger.error('upsert transactionsParsed failed', error);
      throw error;
    }
  }

  @Process(QUEUE_PROCESSOR.PERSIST_DB.TOKEN_PRICE)
  async persistTokenPrice(
    job: Job<{
      address: string;
      tokenPrices: {
        price: number;
        time: Date;
      }[];
    }>,
  ) {
    const { address, tokenPrices } = job.data;
    try {
      if (tokenPrices?.length) {
        await this.tokenPriceRepository.saveListTokenPrice(
          address,
          tokenPrices,
        );
        this.logger.info('token price saved to db: ' + tokenPrices.length);
      }
    } catch (error) {
      this.logger.error('upsert tokenPrice failed', error);
      throw error;
    }
  }

  @OnQueueCompleted()
  async onQueueCompleted(job: Job<any>) {
    // console.log('🚀 ~ DONE JOB', job?.data, job?.name, job?.opts);
  }
}
