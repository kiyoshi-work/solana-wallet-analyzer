import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configQueue } from './configs';
import { QueueService } from './queue.service';
import { QUEUE_NAME } from '@/shared/constants/queue';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configQueue],
    }),
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
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUEUE_NAME.PERSIST_DB,
    }),
  ],
  controllers: [],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
