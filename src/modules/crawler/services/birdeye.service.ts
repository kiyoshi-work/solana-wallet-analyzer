import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseRequestService } from './base-request.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WRAPPED_SOLANA_ADDRESS } from '@/blockchain/services/solana.service';

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
  name: string;
  logoURI?: string;
  address: string;
  symbol: string;
  supply: number;
  totalToken: number;
  totalSolana: number;
  totalUSD: number;

  listSolana: number[];
  blockTimes: Date[];
  // txhs: string[];
  social_link?: any;
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

  async getTokenInfo(address: string): Promise<ITokenInfo> {
    const url = `/defi/token_overview`;
    try {
      const response = await this.sendRequest({
        method: 'GET',
        url: url,
        params: {
          address,
        },
        headers: this._buildHeader(),
      });
      return response.data as ITokenInfo;
    } catch (error) {
      console.error('[BirdeyeService] [getTokenInfo]', error);
    }
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

  async getWalletTradesHistoryAnchor(
    address: string,
    limit: number = 200,
    before?: string,
  ) {
    const url = `/v1/wallet/tx_list`;
    try {
      const response = await this.sendRequest({
        method: 'GET',
        url: url,
        params: {
          wallet: address,
          limit: limit,
          before: before,
        },
        headers: this._buildHeader(),
      });
      return response.data?.[EChainName.SOLANA] as IWalletTransaction[];
    } catch (error) {
      // throw error;
      throw new Error('Error fetching wallet trade history data:' + error);
    }
  }

  async getWalletTradesHistory(
    address: string,
    limit: number = 200,
    maxRecursive: number = 1,
  ) {
    let numQuery = 0;
    let before;
    let res = [];
    try {
      while (true) {
        const entries = await this.getWalletTradesHistoryAnchor(
          address,
          limit,
          before,
        );
        res = [...res, ...entries];
        numQuery += 1;
        before = entries[entries.length - 1]?.txHash;
        console.log('before', before, '====> ', numQuery);
        if (!before || (maxRecursive !== -1 && maxRecursive <= numQuery)) {
          break;
        }
      }
    } catch (error) {
      if (res.length) {
        this.logger.error(error);
      } else {
        throw error;
      }
    }
    return res;
  }

  convertTransactionData(data: any[]): IGroupedTransaction {
    return data.reduce((acc, tx) => {
      const tokenBalanceChange = tx.balanceChange.find(
        (bc) => bc.address !== WRAPPED_SOLANA_ADDRESS,
      );
      const solanaBalanceChange = tx.balanceChange.find(
        (bc) => bc.address === WRAPPED_SOLANA_ADDRESS,
      );
      if (tokenBalanceChange) {
        const parsedAmount =
          tokenBalanceChange.amount / Math.pow(10, tokenBalanceChange.decimals);
        const parsedSolAmount =
          solanaBalanceChange.amount /
          Math.pow(10, solanaBalanceChange.decimals);

        acc[tokenBalanceChange.address] = {
          name: tokenBalanceChange.name,
          logoURI: tokenBalanceChange.logoURI,
          address: tokenBalanceChange.address,
          symbol: tokenBalanceChange.symbol,
          totalToken:
            acc?.[tokenBalanceChange.address]?.totalToken ||
            0 + Math.abs(parsedAmount),
          totalSolana:
            acc?.[tokenBalanceChange.address]?.totalSolana ||
            0 + Math.abs(parsedSolAmount),
          // amountTokens: [
          //   ...(acc?.[tokenBalanceChange.address]?.amountTokens || []),
          //   Math.abs(parsedAmount),
          // ],
          // amountSols: [
          //   ...(acc?.[tokenBalanceChange.address]?.amountSols || []),
          //   Math.abs(parsedSolAmount),
          // ],
          blockTimes: [
            ...(acc?.[tokenBalanceChange.address]?.blockTimes || []),
            new Date(tx.blockTime),
          ],
        };
      }
      return acc;
    }, {});
  }

  async groupTransactionOfWallet(
    address: string,
    limit: number = 200,
    maxRecursive: number = 1,
  ): Promise<IGroupedTransactionBuySell> {
    const transactions = await this.getWalletTradesHistory(
      address,
      limit,
      maxRecursive,
    );
    const groupedSellTransactions = transactions.filter((tx) => {
      return (
        tx.balanceChange.length === 2 &&
        tx.balanceChange.some(
          (bc) => bc.address === WRAPPED_SOLANA_ADDRESS && bc.amount > 0,
        ) &&
        tx.balanceChange.some(
          (bc) => bc.address !== WRAPPED_SOLANA_ADDRESS && bc.amount < 0,
        )
      );
    });

    const groupedBuyTransactions = transactions.filter((tx) => {
      return (
        tx.balanceChange.length === 2 &&
        tx.balanceChange.some(
          (bc) => bc.address === WRAPPED_SOLANA_ADDRESS && bc.amount < 0,
        ) &&
        tx.balanceChange.some(
          (bc) => bc.address !== WRAPPED_SOLANA_ADDRESS && bc.amount > 0,
        )
      );
    });
    console.log(
      `======== FETCHED ${groupedBuyTransactions.length} buy transactions and ${groupedSellTransactions.length} sell transactions of ${address}`,
    );
    const sell = this.convertTransactionData(groupedSellTransactions);
    const buy = this.convertTransactionData(groupedBuyTransactions);
    return { buy, sell };
  }

  async getATHAndCurrentTokenPriceFrom(address: string, from: Date) {
    const url = `/defi/history_price`;
    console.log('CALLING getATHAndCurrentTokenPriceFrom', from, address);
    try {
      // TODO: check Date.now() / 1000 - from.getTime() / 1000 too long fix type to time suitable
      let type;
      const now = Date.now();
      if (now - from.getTime() > 1000 * 60 * 60 * 24 * 30) {
        type = '1D';
      } else if (now - from.getTime() > 1000 * 60 * 60 * 24 * 1) {
        type = '30m';
      } else {
        type = '5m';
      }
      const response = await this.sendRequest({
        method: 'GET',
        url: url,
        params: {
          address: address,
          address_type: 'token',
          type: type,
          time_from: Math.floor(from.getTime() / 1000),
          time_to: Math.floor(Date.now() / 1000),
        },
        headers: this._buildHeader(),
      });
      const athItem = response?.data?.items.reduce(
        (max, item) => (item.value > max.value ? item : max),
        { value: 0, unixTime: 0 },
      );
      return {
        ath: athItem.value,
        athUnixTime: athItem.unixTime
          ? new Date(athItem.unixTime * 1000)
          : undefined,
        current:
          response?.data?.items?.[response?.data?.items?.length - 1]?.value,
      };
    } catch (error) {
      this.logger.error(error);
      return undefined;
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
