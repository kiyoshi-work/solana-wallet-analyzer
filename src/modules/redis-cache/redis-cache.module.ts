import { Module, Global, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisCacheService } from './redis-cache.service';
import { Redis } from 'ioredis';
import { configRedisCache } from './redis-cache.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configRedisCache],
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CACHE',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('redis_cache.host');
        const port = configService.get<string>('redis_cache.port');
        const database = configService.get<number>('redis_cache.database');
        const password = configService.get<string>('redis_cache.password');
        const redis = new Redis({
          host,
          port: Number(port),
          lazyConnect: true,
          db: Number(database),
          password: password,
        });
        return redis;
      },
      inject: [ConfigService],
    },
    RedisCacheService,
  ],
  exports: [RedisCacheService],
})
export class RedisCacheModule implements OnApplicationBootstrap {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async onApplicationBootstrap() {
    // await this.redisCacheService.setATHTokenPrice(
    //   'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump',
    //   new Date(1729317089000),
    //   -Infinity,
    // );
    // const ath = await this.redisCacheService.getATHTokenPrice(
    //   'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump',
    //   new Date(1729317089000),
    // );
    // console.log(ath);
  }
}
