import { registerAs } from '@nestjs/config';
import process from 'process';

export const configQueue = registerAs('queue', () => ({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  database: process.env.REDIS_DATABASE,
  password: process.env.REDIS_PASSWORD,
}));
