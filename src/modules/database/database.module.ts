import { Module } from '@nestjs/common';
import { configDb } from './configs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/database/entities';
import {
  AdminConfigRepository,
  DeviceLogRepository,
  GainRepository,
  HoldingTokenRepository,
  PriceRepository,
  TokenPriceRepository,
  TokenRepository,
  TransactionRepository,
  UserReportRepository,
  UserRepository,
} from './repositories';
import { AdminConfigEntity } from './entities/admin-config.entity';
import { SeedDatabase } from './seeders/seed.database';
import { PriceEntity } from './entities/price.entity';
import { TokenEntity } from './entities/token.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { DeviceLogEntity } from './entities/device-log.entity';
import { UserReportEntity } from './entities/user-report.entity';
import { TokenPriceEntity } from './entities/token-price.entity';
import { HoldingTokenEntity } from './entities/holding-token.entity';
import { GainEntity } from './entities/gain.entity';

const repositories = [
  UserRepository,
  AdminConfigRepository,
  PriceRepository,
  TokenRepository,
  TransactionRepository,
  DeviceLogRepository,
  UserReportRepository,
  TokenPriceRepository,
  HoldingTokenRepository,
  GainRepository,
];

const services = [];

const entities = [
  UserEntity,
  AdminConfigEntity,
  PriceEntity,
  TokenEntity,
  TransactionEntity,
  DeviceLogEntity,
  UserReportEntity,
  TokenPriceEntity,
  HoldingTokenEntity,
  GainEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('db'),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(entities),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configDb],
    }),
  ],
  controllers: [],
  providers: [...repositories, ...services, SeedDatabase],
  exports: [...repositories, ...services],
})
export class DatabaseModule {}
