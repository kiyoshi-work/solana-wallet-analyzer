import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import {
  AdminConfigRepository,
  PriceRepository,
  TransactionRepository,
} from '@/database/repositories';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BirdEyeService } from '@/crawler/services/birdeye.service';
import { WRAPPED_SOLANA_ADDRESS } from '@/blockchain/services/solana.service';
import { IsNull } from 'typeorm';
import { roundDate } from '@/shared/helper';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectPinoLogger(ScheduleService.name)
    private readonly logger: PinoLogger,
    private readonly adminConfigRepository: AdminConfigRepository,
    private readonly priceRepository: PriceRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly birdEyeService: BirdEyeService,
  ) {}

  private async saveSolanaPriceMonthByMonth(startDate: Date, endDate: Date) {
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(currentDate.getMonth() + 1);
      this.logger.info(`From ${currentDate} ====> ${nextMonth}`);
      const priceData = await this.birdEyeService.getTokenPriceBetween(
        WRAPPED_SOLANA_ADDRESS,
        currentDate,
        nextMonth,
      );
      await this.priceRepository.upsert(
        priceData
          .filter((d) => d.price)
          .map((d) => ({ time: d.time, price: d.price, symbol: 'SOL' })),
        { conflictPaths: ['time'], skipUpdateIfNoValuesChanged: true },
      );
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  @Interval(60 * 1000)
  async cronFetchSolanaPrice() {
    const setting =
      await this.adminConfigRepository.findOneByKey('sync_sol_price');
    if (setting?.value === 'start') {
      await this.adminConfigRepository.update(
        { id: setting.id },
        { value: 'end' },
      );
      const lastTime = await this.priceRepository.getLastTime('SOL');
      this.logger.trace(`Start sync solana price from ${lastTime}`);
      await this.saveSolanaPriceMonthByMonth(lastTime, new Date());
    }
  }

  @Interval(60 * 1000)
  async cronUpdateSolanaPriceToTransaction() {
    const setting = await this.adminConfigRepository.findOneByKey(
      'update_solana_price_in_transactions',
    );
    if (setting?.value === 'start') {
      await this.adminConfigRepository.update(
        { id: setting.id },
        { value: 'end' },
      );
      while (true) {
        try {
          const transactions = await this.transactionRepository.find({
            where: { solana_price: IsNull() },
            select: [
              'id',
              'block_time',
              'side',
              'from_address',
              'to_address',
              'from_ui_amount',
              'to_ui_amount',
            ],
            take: 200,
          });
          if (!transactions.length) {
            break;
          }
          const listBlockTimes = [
            ...new Set(
              transactions.map((tx) => roundDate(tx.block_time, 'hour')),
            ),
          ];
          const solanaPrices = await this.priceRepository.getPrices(
            'SOL',
            listBlockTimes,
          );
          const priceSolMap = {};
          solanaPrices.forEach((price) => {
            priceSolMap[price.time.getTime()] = price.price;
          });
          const updateQuery = transactions
            .map((tx) => {
              const solPrice =
                priceSolMap[roundDate(tx?.block_time, 'hour')?.getTime()];
              return `
    UPDATE "transactions"
    SET solana_price = '${solPrice}'
    WHERE id = '${tx.id}'
    `;
            })
            .join('; ');
          await this.transactionRepository.query(updateQuery);
          this.logger.info(
            'Update USD amount in transactions: ' + transactions.length,
          );
        } catch (error) {
          this.logger.error(error);
          break;
        }
      }
      console.log('Done update USD amount in transactions');
    }
  }

  async onModuleInit() {}
}
