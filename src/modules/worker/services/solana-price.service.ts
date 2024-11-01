import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import WebSocket from 'ws';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { RedisCacheService } from '@/redis-cache/redis-cache.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PriceRepository } from '@/database/repositories';
import { WRAPPED_SOLANA_ADDRESS } from '@/blockchain/services/solana.service';
import { roundDate } from '@/shared/helper';
import { BirdEyeService } from '@/crawler/services/birdeye.service';

@Injectable()
export class SolanaPriceService implements OnApplicationBootstrap {
  private _socket: any;
  private readonly socketUrl: string;
  private solanaPrice: number;

  constructor(
    private readonly redisService: RedisCacheService,
    private readonly priceRepository: PriceRepository,
    private readonly birdEyeService: BirdEyeService,
    @InjectPinoLogger(SolanaPriceService.name)
    private readonly logger: PinoLogger,
  ) {
    this.socketUrl = 'wss://stream.binance.com:9443/ws/solusdt@trade';
  }
  async getSolanaPrice() {
    const price = await this.redisService.hget('price:solana', 'price');
    return price;
  }

  async listenPriceChange() {
    if (!this._socket || this._socket.readyState !== WebSocket.OPEN) {
      this._socket?.close();
      this._socket = new WebSocket(this.socketUrl, {
        // transports: ['websocket'],
        // reconnection: true,
      });
      this._socket.on('message', (data: any) => {
        const tradeData = JSON.parse(data.toString());
        const price = tradeData.p;
        this.solanaPrice = price;
      });
      this._socket.on('open', () => {
        this.logger.info('WebSocket connection opened.');
      });
      this._socket.on('error', (error) =>
        this.logger.info('WebSocket error:', error),
      );
    }
  }

  // @Interval(10 * 1000)
  async saveSolanaPrice() {
    if (this.solanaPrice) {
      await this.redisService.hset('price:solana', {
        price: this.solanaPrice,
        updated_at: new Date().toISOString(),
      });
      this.logger.info('UPDATED SOL PRICE: ' + this.solanaPrice);
    }
  }

  // @Interval(60 * 60 * 1000)
  async reloadSocket() {
    this.logger.info('Reload Socket');
    this._socket.disconnect();
    this._socket = undefined;
    await this.listenPriceChange();
  }

  @Interval(20 * 60 * 1000)
  // @Timeout(2000)
  async updateSolanaPrice() {
    const price = await this.birdEyeService.getTokenPrice(
      WRAPPED_SOLANA_ADDRESS,
    );
    if (price) {
      await this.priceRepository.upsert(
        { time: roundDate(new Date(), 'hour'), price, symbol: 'SOL' },
        { conflictPaths: ['time'] },
      );
      this.logger.info('UPDATED SOL PRICE: ' + price);
    }
  }
  private initialize = async () => {
    await this.listenPriceChange();
  };
  async onApplicationBootstrap() {
    // await this.initialize();
  }
}
