import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseModule } from '@/database';
import {
  HealthController,
  ReportController,
  WalletController,
} from '@/api/controllers';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisStore } from 'cache-manager-redis-store';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { configAuth } from './configs/auth';
import { configCache } from './configs/cache';
import { BusinessModule } from '@/business/business.module';
import { PriceRepository } from '@/database/repositories';
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: process.env.APP_ENV === 'production' ? 60 : 600,
    }),
    DatabaseModule,
    BusinessModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const urlRedis = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DATABASE}`;
        return {
          ttl: configService.get('cache.api.cache_ttl'),
          // store: (await redisStore({
          //   url: urlRedis,
          //   ttl: Number(configService.get('cache.api.cache_ttl')) / 1000,
          // })) as unknown as CacheStore,
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configAuth, configCache],
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwt.jwt_secret_key'),
        global: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController, WalletController, ReportController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class ApiModule implements OnApplicationBootstrap {
  constructor(private readonly priceRepo: PriceRepository) {}

  async onApplicationBootstrap() {
    // const m = await this.priceRepo.getATHTokenPrice(
    //   new Date('2023-01-01'),
    //   new Date('2023-02-02'),
    // );
    // console.log(m);
  }
}
