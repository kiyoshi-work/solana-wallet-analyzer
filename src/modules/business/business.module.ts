import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CrawlerModule } from '@/crawler/crawler.module';
import { BlockchainModule } from '@/blockchain';
import { QueueModule } from '@/queue/queue.module';
import { WalletService } from './services/wallet.service';
import { TokenRepository } from '@/database/repositories';

const services = [WalletService];
@Module({
  imports: [
    DatabaseModule,
    CrawlerModule,
    BlockchainModule,
    QueueModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [],
    }),
    // JwtModule.registerAsync({
    //   useFactory: (configService: ConfigService) => ({
    //     secret: configService.get<string>('auth.key.jwt_secret_key'),
    //     global: true,
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  providers: [...services],
  exports: [...services],
})
export class BusinessModule implements OnApplicationBootstrap {
  constructor(private readonly tokenRepository: TokenRepository) {}

  async onApplicationBootstrap() {
    // const m = await this.tokenRepository.getTokenInfoByAddresses([
    //   '7GsG9BNJx7c7Ch5Q2Xd6NjZkxpMKenvKKvbuajSKmj7U',
    // ]);
    // console.log(m);
  }
}
