import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export const configDb = registerAs(
  'db',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'postgres',
    synchronize: Boolean(Number(process.env.DB_SYNC)) || false,
    autoLoadEntities: true,
    logging: Boolean(Number(process.env.DB_DEBUG)) || false,
  }),
);
