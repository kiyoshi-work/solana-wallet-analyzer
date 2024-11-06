import {
  IGroupedTransactionBuySell,
  ITokenInfo,
  ITransaction,
} from '@/crawler/services/birdeye.service';
import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@/redis-cache/redis-cache.service';
import {
  BASE_ADDRESSES_ALL,
  SolanaService,
} from '@/blockchain/services/solana.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  DeviceLogRepository,
  GainRepository,
  TokenRepository,
  TransactionRepository,
} from '@/database/repositories';
import { CacheStrategy, UseResilience } from 'nestjs-resilience';
import { QueueService } from '@/queue/queue.service';
import { Transaction } from '@solana/web3.js';

@Injectable()
export class WalletService {
  private solanaPrice: number;
  constructor(
    @InjectPinoLogger(WalletService.name)
    private readonly logger: PinoLogger,
    private readonly tokenRepository: TokenRepository,
    private readonly redisCacheService: RedisCacheService,
    private readonly queueService: QueueService,
    private readonly solanaService: SolanaService,
    private readonly gainRepository: GainRepository,
    private readonly deviceLogRepository: DeviceLogRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async filledGroupedTransactions(
    groupedTransactions: IGroupedTransactionBuySell,
  ) {
    // list  all keys of group transaction not have property name in each object child
    const groupedTransactionsWithoutTokenInfo = [
      ...new Set([
        ...Object.keys(groupedTransactions?.sell),
        ...Object.keys(groupedTransactions?.buy),
      ]),
    ];
    if (groupedTransactionsWithoutTokenInfo.length) {
      const tokenInfoMap: Record<
        string,
        {
          name?: string;
          address?: string;
          symbol?: string;
          decimals?: number;
          logoURI?: string;
          supply?: number;
          social_link?: any;
        }
      > = {};
      const tokensFromDb = await this.tokenRepository.getTokenInfoByAddresses(
        groupedTransactionsWithoutTokenInfo,
      );
      for (const token of tokensFromDb) {
        tokenInfoMap[token.address] = token;
      }
      const tokenAddressNotInDbs = groupedTransactionsWithoutTokenInfo.filter(
        (address) => !tokenInfoMap[address],
      );
      let tokensInfoNotInDb: ITokenInfo[] = [];
      // NOTE: comment when no need token info
      if (tokenAddressNotInDbs.length) {
        console.log(
          `========= TOTAL CALL METAPLEX to GET TOKEN INFO: ${tokenAddressNotInDbs?.length}`,
        );
        tokensInfoNotInDb = await Promise.all(
          tokenAddressNotInDbs.map((address) =>
            this.solanaService.getTokenInfo(address),
          ),
        );
      }
      const formattedTokensInfoNotInDB = tokensInfoNotInDb
        .filter((dt) => dt?.address)
        .map((token) => ({
          name: token.name,
          address: token.address,
          symbol: token.symbol,
          decimals: Number(token.decimals) || undefined,
          logoURI: token.logoURI,
          supply: Number(token.supply) || undefined,
          social_link: {
            telegram: token?.extensions?.telegram,
            twitter: token?.extensions?.twitter,
            website: token?.extensions?.website,
            github: token?.extensions?.github,
            email: token?.extensions?.email,
            coingeckoId: token?.extensions?.coingeckoId,
            coinmarketcapId: token?.extensions?.coinmarketcapId,
          },
        }));
      for (const token of formattedTokensInfoNotInDB) {
        tokenInfoMap[token.address] = token;
      }
      for (const key of Object.keys(groupedTransactions.buy)) {
        groupedTransactions.buy[key] = {
          ...groupedTransactions.buy[key],
          name: tokenInfoMap[key]?.name,
          address: tokenInfoMap[key]?.address,
          symbol: tokenInfoMap[key]?.symbol,
          logoURI: tokenInfoMap[key]?.logoURI,
          supply: tokenInfoMap[key]?.supply,
          social_link: tokenInfoMap[key]?.social_link,
        };
      }
      await Promise.all(
        Object.keys(groupedTransactions.sell).map(async (key) => {
          groupedTransactions.sell[key] = {
            ...groupedTransactions.sell[key],
            name: tokenInfoMap[key]?.name,
            address: tokenInfoMap[key]?.address,
            symbol: tokenInfoMap[key]?.symbol,
            logoURI: tokenInfoMap[key]?.logoURI,
            supply: tokenInfoMap[key]?.supply,
            social_link: tokenInfoMap[key]?.social_link,
          };
        }),
      );
      this.queueService.persistTokens(formattedTokensInfoNotInDB);
    }
    return groupedTransactions;
  }
  async readThroughGroupTransaction(
    userAddress: string,
    force: boolean = false,
    isOnlyGetTransactionInDb = false,
  ): Promise<IGroupedTransactionBuySell> {
    let groupedTransactions;
    if (!force) {
      groupedTransactions =
        await this.redisCacheService.hgetGroupTransaction(userAddress);
    }
    if (!(groupedTransactions && Object.keys(groupedTransactions).length)) {
      groupedTransactions = await this.solanaService.groupTransactionOfWalletv2(
        userAddress,
        force ? 800 : 800,
        isOnlyGetTransactionInDb,
        // force ? -1 : 1,
      ); // ~3s
      groupedTransactions =
        await this.filledGroupedTransactions(groupedTransactions); // ~7s
      // TODO: move to mongodb -- NOTE: comment when running aggregate to not cache
      this.redisCacheService
        .hsetGroupTransaction(userAddress, groupedTransactions, 5 * 60)
        .then(() => this.logger.info('group transaction redis cache setted'))
        .catch((err) => {
          this.logger.error(err);
        });
    }
    return groupedTransactions;
  }
  async getAnalyzeInfo(
    sellTransaction: ITransaction,
    buyTransaction: ITransaction,
  ) {
    const lastestSellTime = sellTransaction.blockTimes.reduce(
      (maxDate, currentDate) => {
        return currentDate > maxDate ? currentDate : maxDate;
      },
      sellTransaction.blockTimes[0],
    );
    const earliestBuyTime = buyTransaction?.blockTimes?.reduce(
      (minDate, currentDate) => {
        return currentDate < minDate ? currentDate : minDate;
      },
      buyTransaction?.blockTimes[0],
    );
    const holdTime = Math.floor(
      (lastestSellTime.getTime() - earliestBuyTime.getTime()) /
        (1000 * 60 * 60),
    );
    // if (holdTime < 0) {
    //   return;
    // }
    const buyTokenPrice = buyTransaction?.totalUSD / buyTransaction?.totalToken;
    const buyTokenPriceBeforeSell =
      buyTransaction?.totalUSDBeforeLastSell /
      buyTransaction?.totalTokenBeforeLastSell;
    const sellTokenPrice =
      sellTransaction?.totalUSD / sellTransaction?.totalToken;
    const supply = buyTransaction?.supply;

    const numBuy = buyTransaction?.listSolana?.length;
    const numSell = sellTransaction?.listSolana?.length;
    const meanBuy =
      buyTransaction?.listSolana?.reduce((a, b) => a + b, 0) / numBuy;
    const meanSell =
      sellTransaction?.listSolana?.reduce((a, b) => a + b, 0) / numSell;
    const stdevBuy = Math.sqrt(
      buyTransaction?.listSolana?.reduce(
        (a, b) => a + Math.pow(b - meanBuy, 2),
        0,
      ) / numBuy,
    );
    const stdevSell = Math.sqrt(
      sellTransaction?.listSolana?.reduce(
        (a, b) => a + Math.pow(b - meanSell, 2),
        0,
      ) / numSell,
    );
    return {
      name: sellTransaction.name,
      logoURI: sellTransaction.logoURI,
      address: sellTransaction.address,
      symbol: sellTransaction.symbol,
      social_link: sellTransaction.social_link,
      supply,

      totalSellToken: sellTransaction?.totalToken,
      totalSellSolana: sellTransaction?.totalSolana,
      avgSellPrice: sellTransaction?.totalSolana / sellTransaction?.totalToken,
      totalBuyToken: buyTransaction?.totalToken,
      totalBuySolana: buyTransaction?.totalSolana,
      avgBuyPrice: buyTransaction?.totalSolana / buyTransaction?.totalToken,

      holdTime: holdTime,
      solanaPrice: this.solanaPrice,

      boughtAtMCC: buyTokenPrice * supply,
      soldAtMCC: sellTokenPrice * supply,
      pnl: sellTransaction.totalToken * (sellTokenPrice - buyTokenPrice),
      pnlPercent: (sellTokenPrice / buyTokenPrice - 1) * 100,

      totalBuyTokenBeforeSell: buyTransaction?.totalTokenBeforeLastSell,
      totalBuySolanaBeforeSell: buyTransaction?.totalSolanaBeforeLastSell,
      avgBuyPriceBeforeSell:
        buyTransaction?.totalSolanaBeforeLastSell /
        buyTransaction?.totalTokenBeforeLastSell,
      pnlBeforeSell:
        sellTransaction.totalToken * (sellTokenPrice - buyTokenPriceBeforeSell),
      pnlPercentBeforeSell:
        (sellTokenPrice / buyTokenPriceBeforeSell - 1) * 100,

      numBuy,
      meanBuy,
      stdevBuy,
      numSell,
      meanSell,
      stdevSell,
      lastestSellTime,
      earliestBuyTime,

      earliestBuyTimeBeforeSell:
        buyTransaction?.blockTimesBeforeLastSell?.length > 0
          ? buyTransaction?.blockTimesBeforeLastSell?.reduce(
              (minDate, currentDate) => {
                return currentDate < minDate ? currentDate : minDate;
              },
              buyTransaction?.blockTimesBeforeLastSell?.[0],
            )
          : null,
    };
  }

  async aggregate() {
    const listAddresses = await this.deviceLogRepository
      .createQueryBuilder('device_logs')
      .select(
        'device_logs.address, CAST(SUM(device_logs.num_request) as INT) AS totalRequests',
      )
      .groupBy('device_logs.address')
      .orderBy('totalRequests', 'DESC')
      .getRawMany();
    const ls = [];
    const batchSize = 10;
    for (let i = 0; i < listAddresses.length; i += batchSize) {
      const batch = listAddresses.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(listAddresses.length / batchSize)}`,
      );
      await Promise.all(
        batch.map(async (dt) => {
          if (
            !(await this.gainRepository.exists({
              where: { user_address: dt.address },
            }))
          ) {
            await this.analyzeOnlyDb(dt.address);
            // ls.push();
          }
        }),
      );
    }
    return ls;
  }

  async analyzeOnlyDb(userAddress: string) {
    const [groupedTransactions] = await Promise.all([
      this.readThroughGroupTransaction(userAddress, true, true),
    ]);
    const res = await Promise.all(
      Object.keys(groupedTransactions?.sell)
        .filter(
          (address) =>
            groupedTransactions?.buy[address] &&
            !BASE_ADDRESSES_ALL.includes(address),
        )
        .map((address: string) =>
          this.getAnalyzeInfo(
            groupedTransactions?.sell[address],
            groupedTransactions?.buy[address],
          ),
        ),
    );
    this.saveGain(
      userAddress,
      res.filter((dt) => dt?.address),
    )
      .then(() => {
        console.log('save gain success');
      })
      .catch((err) => {
        this.logger.error(err);
      });
    return res;
    // .filter((dt) => dt && dt.pnl > 0 && dt?.symbol)
    // .sort((a, b) => b.pnl - a.pnl)
    // .slice(0, 5);
  }

  @UseResilience(new CacheStrategy(3000))
  async analyze(userAddress: string) {
    const [groupedTransactions] = await Promise.all([
      this.readThroughGroupTransaction(userAddress),
    ]);
    const res = await Promise.all(
      Object.keys(groupedTransactions?.sell)
        .filter(
          (address) =>
            groupedTransactions?.buy[address] &&
            !BASE_ADDRESSES_ALL.includes(address),
        )
        .map((address: string) =>
          this.getAnalyzeInfo(
            groupedTransactions?.sell[address],
            groupedTransactions?.buy[address],
          ),
        ),
    );
    this.saveGain(
      userAddress,
      res.filter((dt) => dt.address),
    )
      .then(() => {
        console.log('save gain success');
      })
      .catch((err) => {
        this.logger.error(err);
      });
    return res
      .filter((dt) => dt && dt.pnl > 0 && dt?.symbol)
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);
  }

  async saveGain(userAddress: string, data: any[]) {
    if (data?.length) {
      await this.gainRepository.delete({ user_address: userAddress });
      await this.gainRepository.upsert(
        data.map((dt) => ({
          user_address: userAddress,
          token_address: dt.address,
          symbol: dt.symbol,

          // total_buy_solana: dt.totalBuySolana,
          // total_buy_token: dt.totalBuyToken,
          // avg_buy_price: dt.avgBuyPrice,

          total_sell_solana: dt.totalSellSolana,
          total_sell_token: dt.totalSellToken,
          avg_sell_price: dt.avgSellPrice,
          sold_at_mcc: dt.soldAtMCC,
          bought_at_mcc: dt.boughtAtMCC,

          // pnl: dt.pnl,
          // pnl_percent: dt.pnlPercent,
          hold_time: dt.holdTime,

          num_buy: dt.numBuy,
          mean_buy: dt.meanBuy,
          stdev_buy: dt.stdevBuy,
          num_sell: dt.numSell,
          mean_sell: dt.meanSell,
          stdev_sell: dt.stdevSell,
          latest_sell: dt.lastestSellTime,
          // earliest_buy: dt.earliestBuyTime,

          earliest_buy: dt.earliestBuyTimeBeforeSell,
          total_buy_solana: dt.totalBuySolanaBeforeSell,
          total_buy_token: dt.totalBuyTokenBeforeSell,
          avg_buy_price: dt.avgBuyPriceBeforeSell,
          pnl: dt.pnlBeforeSell,
          pnl_percent: dt.pnlPercentBeforeSell,
        })),
        { conflictPaths: ['user_address', 'token_address'] },
      );
    }
  }

  // async recheckTransaction(take: number = 1000) {
  //   const transactions = await this.transactionRepository.find({
  //     where: { recheck: false },
  //     take: take,
  //     select: ['signature'],
  //   });
  //   const batchSize = 100;
  //   if (transactions?.length) {
  //     for (let i = 0; i < transactions.length; i += batchSize) {
  //       const batch = transactions.slice(i, i + batchSize);
  //       await Promise.all(
  //         batch.map(async (dt) => {
  //           await this.checkTransaction(dt.signature);
  //         }),
  //       );
  //     }
  //   }
  // }
}
