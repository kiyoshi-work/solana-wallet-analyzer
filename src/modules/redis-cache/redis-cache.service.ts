import { IHoldingToken } from '@/blockchain/services/solana.service';
import {
  IGroupedTransaction,
  IGroupedTransactionBuySell,
} from '@/crawler/services/birdeye.service';
import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  @Inject('REDIS_CACHE')
  private cache: Redis;

  constructor() {}

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, time?: any) {
    // TODO: add ttl
    time
      ? await this.cache.set(key, value, 'PX', time)
      : await this.cache.set(key, value);
  }

  async hget(key: string, field: string): Promise<any> {
    return this.cache.hget(key, field);
  }

  async hset(key: string, value: Record<string, any>, expired?: any) {
    await this.cache.hset(key, value);
    await this.cache.expireat(
      key,
      Math.round(Date.now() / 1000) + (expired || 60),
    );
  }

  async hgetGroupTransaction(key: string, field?: string): Promise<any> {
    const _tmp = (await this.cache.hgetall(`transacion:${key}`)) as any;
    const res = {};
    Object.keys(_tmp).forEach((_key) => {
      res[_key] = JSON.parse(_tmp[_key]) as IGroupedTransaction;
    });
    return this.convertDateProperties(res);
  }

  private convertDateProperties(obj: any): any {
    if (Array.isArray(obj)) {
      // Check if the array consists solely of date strings
      if (
        obj.every(
          (item) => typeof item === 'string' && !isNaN(Date.parse(item)),
        )
      ) {
        return obj.map((item) => new Date(item)); // Convert each string to Date
      } else {
        // If not all items are date strings, process each item recursively
        return obj.map((item) => this.convertDateProperties(item));
      }
    } else if (obj && typeof obj === 'object') {
      // If the input is an object, iterate over its properties
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Check if the value is a string that can be parsed as a date
          if (typeof obj[key] === 'string' && !isNaN(Date.parse(obj[key]))) {
            obj[key] = new Date(obj[key]); // Convert to Date object
          } else {
            // Recursively handle nested objects and arrays
            obj[key] = this.convertDateProperties(obj[key]);
          }
        }
      }
    }
    return obj; // Return the modified object or array
  }
  async hsetGroupTransaction(
    key: string,
    value: IGroupedTransactionBuySell,
    expired?: number,
  ) {
    // const _state = {};
    // Object.keys(value).forEach((_key) => {
    //   if (value[_key] && Object.keys(value[_key]).length) {
    //     _state[_key] = JSON.stringify(value[_key]);
    //   } else {
    //     _state[_key] = value[_key];
    //   }
    // });
    await this.cache.hset(`transacion:${key}`, {
      buy: JSON.stringify(value?.buy),
      sell: JSON.stringify(value?.sell),
    });
    await this.cache.expireat(
      `transacion:${key}`,
      Math.round(Date.now() / 1000) + (expired || 60),
    );
  }

  async setHoldingToken(key: string, value: IHoldingToken[], expired?: number) {
    await this.cache.set(`holding_token:${key}`, JSON.stringify(value));
    await this.cache.expireat(
      `holding_token:${key}`,
      Math.round(Date.now() / 1000) + (expired || 60),
    );
  }

  async getHoldingToken(key: string): Promise<IHoldingToken[]> {
    const _tmp = (await this.cache.get(`holding_token:${key}`)) as any;
    return JSON.parse(_tmp);
  }

  async setCurrentTokenPrice(
    tokenAddress: string,
    value: number,
    expired?: number,
  ) {
    await this.cache.set(`curr_token_price:${tokenAddress}`, value);
    await this.cache.expireat(
      `curr_token_price:${tokenAddress}`,
      Math.round(Date.now() / 1000) + (expired || 60),
    );
  }

  async getCurrentTokenPrice(tokenAddress: string): Promise<number> {
    const _tmp = (await this.cache.get(
      `curr_token_price:${tokenAddress}`,
    )) as any;
    return Number(_tmp);
  }

  async setATHTokenPrice(
    tokenAddress: string,
    date: Date,
    data: { ath: number; athSol: number },
    expired?: number,
  ) {
    await this.cache.set(
      `ath_token_price:${tokenAddress}:${date.getTime()}`,
      JSON.stringify(data),
    );
    await this.cache.expireat(
      `ath_token_price:${tokenAddress}:${date.getTime()}`,
      Math.round(Date.now() / 1000) + (expired || 60),
    );
  }

  async getATHTokenPrice(tokenAddress: string, date: Date): Promise<number> {
    const data = (await this.cache.get(
      `ath_token_price:${tokenAddress}:${date.getTime()}`,
    )) as any;
    return JSON.parse(data);
  }

  async reset() {
    await this.cache.reset();
  }

  async del(key: string) {
    await this.cache.del(key);
  }
}
