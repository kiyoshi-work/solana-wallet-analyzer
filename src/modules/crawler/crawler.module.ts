import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { configCrawler } from './configs/crawler';
import { ConfigModule } from '@nestjs/config';
import { BirdEyeService } from './services/birdeye.service';
import { ParseTxService } from './services/parse-tx.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configCrawler],
    }),
  ],
  providers: [BirdEyeService, ParseTxService],
  exports: [BirdEyeService, ParseTxService],
})
export class CrawlerModule implements OnApplicationBootstrap {
  constructor(
    private readonly birdEyeService: BirdEyeService,
    private readonly parseTxService: ParseTxService,
  ) {}
  async onApplicationBootstrap() {}
}
