import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { BlockchainOptions } from './options';
import { CHAINS, configBlockchain } from '@/blockchain/configs';
import { DatabaseModule } from '@/database';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from '@solana/web3.js';
import { SolanaService } from './services/solana.service';
import { CrawlerModule } from 'modules/crawler/crawler.module';
import { RedisCacheModule } from '@/redis-cache/redis-cache.module';
import * as fs from 'fs';
import { QueueModule } from '@/queue/queue.module';

@Module({
  imports: [
    DatabaseModule,
    CrawlerModule,
    RedisCacheModule,
    QueueModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configBlockchain],
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: 'SOLANA_CONNECTION',
      useFactory: async (config: ConfigService) => {
        const blockchainOptions: BlockchainOptions = config.get('blockchain');
        const chainId = blockchainOptions.mainnet ? 101 : 101;
        const chain = CHAINS[chainId];
        try {
          return new Connection(chain.url);
        } catch (e) {
          console.log('SOLANA_CONNECTION');
          console.error(e);
          throw e;
        }
      },
      inject: [ConfigService],
    },
    SolanaService,
  ],
  exports: ['SOLANA_CONNECTION', SolanaService],
})
export class BlockchainModule implements OnApplicationBootstrap {
  constructor(private solanaService: SolanaService) {}

  async onApplicationBootstrap() {
    // const m = await this.solanaService.getTokenBalance(
    //   'Av9ZubuZKCqEanoZhxyWASfFYudV2Tp3CzrQi1YHDsJ9',
    // );
    // console.log(JSON.stringify(m));
    // const txhs = await this.solanaService.getWalletTransactions(
    //   'BNnN2MqfWLvgThYBsv6v8JQaYZXYKYahC5YCy27Ct1cX',
    //   300,
    // );
    // fs.writeFileSync('output2.json', JSON.stringify(txhs, null, 2));
    // console.log(txhs, 'txhs');
    // const txh = await this.solanaService.getParseTransactionSolana(
    //   '3MdDcNQ2Us33njP9Q16mvfw14vhwfjCyaZGdvzGeyTWBtAsPk3PgSvPykFcNaRDKwFt6Q8S6hVMkhw3Ujgph3KW4',
    // );
    // console.log(txh);
    // const y = await this.solanaService.getTokenInfo(
    //   'HUdqc5MR5h3FssESabPnQ1GTgTcPvnNudAuLj5J6a9sU',
    // );
    // console.log(y, 'ccc');
  }
}
