import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseRequestService } from './base-request.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export enum EChainName {
  SOLANA = 'solana',
}

export interface ITokenInfo {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  logoURI: string;
  supply: number;

  // Optional
  circulatingSupply: number;
  mc: number;
  price: number;
  extensions: any;
}
export interface ITransaction {
  name?: string;
  logoURI?: string;
  address: string;
  symbol?: string;
  supply?: number;
  totalToken?: number;
  totalSolana?: number;
  totalUSD?: number;

  listSolana?: number[];
  blockTimes?: Date[];
  txhs?: string[];
  social_link?: any;

  totalSolanaBeforeLastSell?: number;
  totalTokenBeforeLastSell?: number;
  totalUSDBeforeLastSell?: number;
  blockTimesBeforeLastSell?: Date[];
}

export interface IGroupedTransactionBuySell {
  buy: IGroupedTransaction;
  sell: IGroupedTransaction;
}

export interface IGroupedTransaction {
  [address: string]: ITransaction;
}

export interface IWalletTransaction {
  txHash: string;
  blockNumber: number;
  blockTime: string;
  status: boolean;
  from: string;
  to: string;
  fee: number;
  mainAction: string;
  balanceChange: IBalanceChange[];
}

interface IBalanceChange {
  amount: number;
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoURI: string;
  tokenAccount?: string;
  owner?: string;
  programId?: string;
}
@Injectable()
export class BirdEyeService extends BaseRequestService {
  private birdeyeApiKeys;
  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(BirdEyeService.name)
    private readonly logger: PinoLogger,
  ) {
    super(
      configService.get<string>('crawler.birdeye.base_url'),
      configService.get<string>('crawler.birdeye.api_key').split(',')[0],
    );
    this.birdeyeApiKeys = configService
      .get<string>('crawler.birdeye.api_key')
      .split(',');
  }

  protected getKey(): string {
    return this.birdeyeApiKeys[
      Math.floor(Math.random() * this.birdeyeApiKeys.length)
    ];
  }

  protected _buildHeader(): Record<string, string> {
    // const headers = super._buildHeader();
    return {
      // ...headers,
      'X-API-KEY': this.getKey(),
      'x-chain': EChainName.SOLANA,
    };
  }

  async getTokenPrice(address: string, date?: Date): Promise<number> {
    // const url = `/defi/price`;
    const url = `/defi/historical_price_unix`;
    try {
      const response = await this.sendRequest({
        method: 'GET',
        url: url,
        params: {
          address,
          unixtime: Math.floor((date ? date.getTime() : Date.now()) / 1000),
        },
        headers: this._buildHeader(),
      });
      return Number(response?.data?.value);
    } catch (error) {
      console.error('[BirdeyeService] [getTokenPrice]', error);
    }
  }

  async getTokenPriceBetween(
    address: string,
    from: Date,
    to: Date,
    type: string = '1H',
  ): Promise<{ price: number; time: Date }[]> {
    console.log('CALLING getTokenPriceBetween', from, to, address);
    const url = `/defi/history_price`;
    try {
      const response = await this.sendRequest({
        method: 'GET',
        url: url,
        params: {
          address: address,
          address_type: 'token',
          type: type,
          time_from: Math.floor(from.getTime() / 1000),
          time_to: Math.floor(to.getTime() / 1000),
        },
        headers: this._buildHeader(),
      });
      return response?.data?.items.map((item) => ({
        price: item.value,
        time: new Date(Number(item?.unixTime) * 1000),
      }));
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
