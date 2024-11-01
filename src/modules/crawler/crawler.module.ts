import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { configCrawler } from './configs/crawler';
import { ConfigModule } from '@nestjs/config';
import { BirdEyeService } from './services/birdeye.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configCrawler],
    }),
  ],
  providers: [BirdEyeService],
  exports: [BirdEyeService],
})
export class CrawlerModule implements OnApplicationBootstrap {
  constructor(private readonly birdEyeService: BirdEyeService) {}
  async onApplicationBootstrap() {
    // const y = await this.birdEyeService.getWalletTradesHistory(
    //   'BNnN2MqfWLvgThYBsv6v8JQaYZXYKYahC5YCy27Ct1cX',
    //   200,
    //   1,
    // );
    // fs.writeFileSync('output1.json', JSON.stringify(y, null, 2));
    // const u = await this.birdEyeService.getTokenPrice(
    //   '3M72drcHXNnPrZU3Wwg4TUDak19pXAnwqaKdHLepGDFr',
    // );
    // console.log(u);
    // const u = await this.birdEyeService.groupTransactionOfWallet(
    //   'Av9ZubuZKCqEanoZhxyWASfFYudV2Tp3CzrQi1YHDsJ9',
    // );
    // console.log(u?.buy);
    // const u = await this.birdEyeService.getATHAndCurrentTokenPriceFrom(
    //   '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    //   new Date('2023-12-14T18:58:25.000Z'),
    // );
    // console.log(u);
    // const v = await this.birdEyeService.getTokenPriceBetween(
    //   'So11111111111111111111111111111111111111112',
    //   new Date('2024-09-01'),
    //   new Date('2024-09-02'),
    // );
    // console.log(v);
    // const y = await this.birdEyeService.getTokenInfo(
    //   'HUdqc5MR5h3FssESabPnQ1GTgTcPvnNudAuLj5J6a9sU',
    // );
    // console.log(y, ';;;;;');
  }
}
