import { registerAs } from '@nestjs/config';

export const configRedisCache = registerAs('redis_cache', () => ({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  database: process.env.REDIS_DATABASE,
  password: process.env.REDIS_PASSWORD,
}));
