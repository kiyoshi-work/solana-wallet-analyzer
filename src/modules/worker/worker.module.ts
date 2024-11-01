import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configQueue } from './configs';
import { DatabaseModule } from '@/database';
import { ScheduleService } from './schedulers/schedule.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiModule } from '@/api';
import { BullModule } from '@nestjs/bull';
import { PersistConsumer } from './consumers';
import { RedisCacheModule } from '@/redis-cache/redis-cache.module';
import { SolanaPriceService } from './services/solana-price.service';
import { CrawlerModule } from '@/crawler/crawler.module';

const isWorker = Boolean(Number(process.env.IS_WORKER || 0));

let consumers = [];
let schedulers = [];

if (isWorker) {
  consumers = [PersistConsumer];
  schedulers = [ScheduleService, SolanaPriceService];
}

@Module({
  imports: [
    ApiModule,
    DatabaseModule,
    RedisCacheModule,
    CrawlerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory(config: ConfigService) {
        const host = config.get<string>('queue.host');
        const port = config.get<number>('queue.port');
        const db = config.get<number>('queue.database');
        const password = config.get<string>('queue.password');
        // const tls = config.get('queue.tls');
        return {
          redis: {
            host: host,
            port: port,
            db: db,
            password: password,
            // tls,
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configQueue],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [...consumers, ...schedulers],
  exports: [],
})
export class WorkerModule {}
