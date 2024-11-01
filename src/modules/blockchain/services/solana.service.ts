import { Inject, Injectable } from '@nestjs/common';
import {
  AccountLayout,
  AccountState,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Commitment,
  Connection,
  GetBalanceConfig,
  ParsedTransactionWithMeta,
  PublicKey,
  TransactionSignature,
} from '@solana/web3.js';
import { BN } from 'bn.js';
export const WRAPPED_SOLANA_ADDRESS =
  'So11111111111111111111111111111111111111112';
export const SOLANA_ADDRESS = 'So11111111111111111111111111111111111111111';
export const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDT_ADDRESS = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const ADDRESS_IGNORE = [
  '35wzEjE4wyZzBhAXDrWqwpVjeG17s8CZkBf5x1PR45Xk',
  'FZN7QZ8ZUUAxMPfxYEYkH3cXUASzH8EqA6B4tyCL8f1j',
  'Ez5ZVsHRdMoi7J9PYxnM2fY4gWtj2ioCc761aYE1YR9m',
]; // SPL token mint burn,
const ADDRESSES = [
  'So11111111111111111111111111111111111111112',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
];

import { Metaplex } from '@metaplex-foundation/js';
import { ENV, TokenListProvider } from '@solana/spl-token-registry';
// import { parseLogs } from '@debridge-finance/solana-transaction-parser';
import {
  IGroupedTransaction,
  IGroupedTransactionBuySell,
} from '@/crawler/services/birdeye.service';
import {
  PriceRepository,
  TransactionRepository,
} from '@/database/repositories';
import { In } from 'typeorm';
import { sign } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { roundDate } from '@/shared/helper';
import { QueueService } from '@/queue/queue.service';

export const BASE_ADDRESSES = [
  WRAPPED_SOLANA_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
];

export const BASE_ADDRESSES_ALL = [
  WRAPPED_SOLANA_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
];

export interface IHoldingToken {
  tokenAddress: string;
  balance: number;
  symbol: string;
  decimals: number;
}

export interface IParsedTransaction {
  txHash: string;
  signer: string;
  blockUnixTime: Date;
  side: 'buy' | 'sell';
  solanaPrice?: number;
  from: {
    decimals?: number;
    address: string;
    uiAmount: number;
  };
  to: {
    decimals?: number;
    address: string;
    uiAmount: number;
  };
}

@Injectable()
export class SolanaService {
  private rpcs;
  constructor(
    @Inject('SOLANA_CONNECTION')
    private readonly solanaProvider: Connection,
    private readonly transactionRepository: TransactionRepository,
    private readonly priceRepository: PriceRepository,
    @InjectPinoLogger(SolanaService.name)
    private readonly logger: PinoLogger,
    private readonly queueService: QueueService,
  ) {
    this.rpcs = process.env.SOLANA_RPCS.split(',');
  }

  private getRPC() {
    return this.rpcs[Math.floor(Math.random() * this.rpcs.length)];
  }
  async getSolanaBalance(
    walletAddress: string,
    commitmentOrConfig?: Commitment | GetBalanceConfig,
  ) {
    const rpc = this.getRPC();
    const solanaProvider = new Connection(rpc);
    const balance = await solanaProvider.getBalance(
      new PublicKey(walletAddress),
      commitmentOrConfig,
    );
    return new BN(balance).div(new BN(1e9)).toNumber();
  }

  async getBalance(
    walletAddress: string,
    tokenMintAddress: string,
  ): Promise<number> {
    const walletPublicKey = new PublicKey(walletAddress);
    const tokenMintPublicKey = new PublicKey(tokenMintAddress);
    try {
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey,
      );
      const rpc = this.getRPC();
      const solanaProvider = new Connection(rpc);
      const accountInfo = await getAccount(
        solanaProvider,
        associatedTokenAddress,
      );
      return Number(accountInfo?.amount);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0; // Return 0 if there's an error
    }
  }

  // [{
  //     "isNative": false,
  //     "mint": "8q3RM2eZM9BUe1eoVUkCn4crLYbXk2cSvxURf9mkyexq",
  //     "owner": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  //     "state": "initialized",
  //     "tokenAmount": {
  //       "amount": "928581278",
  //       "decimals": 6,
  //       "uiAmount": 928.581278,
  //       "uiAmountString": "928.581278"
  //     }
  //   }]
  async getTokenHoldings(address: string) {
    const rpc = this.getRPC();
    const solanaProvider = new Connection(rpc);
    try {
      const [token, token2022] = await Promise.all([
        solanaProvider.getParsedTokenAccountsByOwner(
          new PublicKey(address),
          {
            programId: TOKEN_PROGRAM_ID,
          },
          'confirmed',
        ),
        solanaProvider.getParsedTokenAccountsByOwner(
          new PublicKey(address),
          {
            programId: new PublicKey(
              'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            ),
          },
          'confirmed',
        ),
      ]);
      return token.value
        .concat(token2022.value)
        .filter(
          (item) => item.account.data.parsed.info.tokenAmount.uiAmount > 0,
        )
        .map((item) => ({ ...item.account.data.parsed.info }));
    } catch (e) {
      console.log('[getTokenHoldings] [error]: ', e);
      return [];
    }
  }
  async getNativeAmount(walletAddress: string) {
    const rpc = this.getRPC();
    const solanaProvider = new Connection(rpc);
    const nativeAmount = await solanaProvider.getBalance(
      new PublicKey(walletAddress),
    );
    return new BN(nativeAmount).div(new BN(1e9)).toNumber();
  }

  // [{
  //   "tokenAddress": "8arEYgkmJgp6GDorP1wjby4z7JiR7VbVEpDZY1hCbBAr",
  //   "balance": 29797,
  //   "symbol": "",
  //   "decimals": 9
  // }]
  async getTokenBalance(
    walletAddress: string,
    isNative = false,
  ): Promise<IHoldingToken[]> {
    const listTokensInWallet = await this.getTokenHoldings(walletAddress);
    const nativeAmount = await this.getNativeAmount(walletAddress);
    const result = listTokensInWallet.map((token) => {
      return {
        tokenAddress: token.mint,
        balance: Number(token.tokenAmount.uiAmount) || 0,
        symbol: token?.symbol || '',
        decimals: Number(token?.tokenAmount?.decimals) || 9,
      };
    });

    if (Number(nativeAmount) > 0 && isNative) {
      result.push({
        tokenAddress: WRAPPED_SOLANA_ADDRESS,
        balance: Number(nativeAmount),
        symbol: 'SOL',
        decimals: 9,
      });
    }

    return result;
  }
  async getTokenHoldingsV2(address: string) {
    const rpc = this.getRPC();
    const solanaProvider = new Connection(rpc);
    try {
      const [token, token2022] = await Promise.all([
        solanaProvider.getTokenAccountsByOwner(
          new PublicKey(address),
          {
            programId: TOKEN_PROGRAM_ID,
          },
          'confirmed',
        ),
        solanaProvider.getTokenAccountsByOwner(
          new PublicKey(address),
          {
            programId: TOKEN_2022_PROGRAM_ID,
          },
          'confirmed',
        ),
      ]);
      return token.value
        .concat(token2022.value)
        .filter(
          (item) =>
            AccountLayout.decode(item.account.data).amount.toString() !== '0',
        )
        .map((item) => {
          const accountDecode = AccountLayout.decode(item.account.data);
          return {
            tokenAddress: accountDecode.mint.toString(),
            isFrozen: accountDecode.state === AccountState.Frozen,
            amount: accountDecode.amount.toString(),
          };
        });
    } catch (e) {
      console.log('[getTokenHoldings] [error]: ', e);
      return [];
    }
  }

  async getTokenBalanceV2(walletAddress: string, isNative = false) {
    const listTokensInWallet = await this.getTokenHoldingsV2(walletAddress);

    const nativeAmount = await this.getNativeAmount(walletAddress);

    const result = listTokensInWallet.map((token) => {
      return {
        tokenAddress: token.tokenAddress,
        balance: token.amount,
        isFrozen: token.isFrozen || false,
      };
    });

    if (Number(nativeAmount) > 0 && isNative) {
      result.push({
        tokenAddress: WRAPPED_SOLANA_ADDRESS,
        balance: Number(nativeAmount),
        symbol: 'SOL',
        decimals: 9,
      } as any);
    }

    return result;
  }

  async getAllTransactionInWallet(
    address: string,
    limit: number = 100,
    until?: TransactionSignature,
  ) {
    try {
      const rpc = this.getRPC();
      const solanaProvider = new Connection(rpc);
      const transactions = await solanaProvider.getSignaturesForAddress(
        new PublicKey(address),
        {
          limit: limit,
          until,
        },
      );
      return transactions;
    } catch (error) {
      return [];
    }
  }

  async getParseTransactionSolana(txh: string): Promise<IParsedTransaction> {
    try {
      const rpc = this.getRPC();
      const solanaProvider = new Connection(rpc);
      const transaction = await solanaProvider.getParsedTransaction(txh, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      const { data, txType, isBuy } =
        await this.parseSwapTransaction2(transaction);
      if (
        !data?.length ||
        !data?.[0]?.address ||
        !data?.[data.length - 1]?.address
      ) {
        return null;
      }
      // const { tokenSymbol, icon, name } = await this.getTokenInfo(
      //   this.solanaProvider,
      //   new PublicKey(data[0].address),
      // );
      // console.log(
      //   'getParseTransactionSolana:this.getTokenInfo',
      //   Date.now() - _st,
      // );

      const formatData: IParsedTransaction = {
        signer:
          transaction.transaction.message.accountKeys[0].pubkey.toString(),
        txHash: txh,
        blockUnixTime: new Date(transaction.blockTime * 1000),
        side: isBuy ? 'buy' : 'sell',
        from: {
          decimals: data[0].decimal,
          address: data[0].address,
          uiAmount: data[0].amountSwapped,
        },
        to: {
          decimals: data[data.length - 1].decimal,
          address: data[data.length - 1].address,
          uiAmount: data[data.length - 1].amountSwapped,
        },
      };
      return formatData;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  parseSwapTransaction = async (
    tx: ParsedTransactionWithMeta,
  ): Promise<any> => {
    const preTokenBalances = tx.meta.preTokenBalances;
    const postTokenBalances = tx.meta.postTokenBalances;
    let postBalanceToken = 0;

    // const parsed = parseLogs(tx.meta.logMessages || []);
    const txType = 'swap';
    // const isSwap = parsed?.find((log) => {
    //   if (log.logMessages[0] === 'Instruction: Swap') {
    //     txType = 'swap';
    //   } else if (log.logMessages[0] === 'Instruction: Transfer') {
    //     txType = 'transfer';
    //   }
    // });

    let data = [];
    let lengMin = Math.min(preTokenBalances.length, postTokenBalances.length);

    preTokenBalances.forEach((preBalance, index) => {
      if (index >= lengMin) {
        return;
      }
      const postBalance = postTokenBalances[index];

      const postBalance2 = postTokenBalances.find(
        (postBalance) => postBalance.accountIndex === preBalance.accountIndex,
      );

      //if (preBalance?.accountIndex === postBalance?.accountIndex) {
      const tokenAddress = preBalance.mint;
      const preAmount = preBalance.uiTokenAmount?.uiAmount;
      const postAmount = postBalance2.uiTokenAmount?.uiAmount;
      const amountSwapped = postAmount - preAmount;

      if (amountSwapped !== 0) {
        data.push({
          address: tokenAddress,
          decimal: preBalance.uiTokenAmount.decimals,
          amountSwapped: amountSwapped,
        });
      }
      //}
    });

    let preBalance = 0;
    let preAddress = '';
    let preDecimal = 0;
    let postBalance = 0;
    let postAddress = '';
    let postDecimal = 0;
    let data2 = [];
    let index = 0;
    if (data?.length) {
      if (data[data.length - 1].address === data[0].address) {
        index = 1;
      } else {
        index = data.length - 1;
      }
      for (let i = 0; i < data.length; i++) {
        preBalance = data[0].amountSwapped;
        preAddress = data[0].address;
        preDecimal = data[0].decimal;
        postBalance = data[index].amountSwapped;
        postAddress = data[index].address;
        postDecimal = data[index].decimal;
        if (data[i].address === preAddress && i !== 0) {
          preBalance = data[i].amountSwapped - preBalance;
          preAddress = data[i].address;
          preDecimal = data[i].decimal;
        }
        if (data[i].address === postAddress && i !== index) {
          postBalance = postBalance - data[i].amountSwapped;
          postAddress = data[i].address;
          postDecimal = data[i].decimal;
        }
      }
    }
    const isBuy = index === 1 ? true : this.checkBuy(preBalance);
    data2 = [
      {
        address: !isBuy ? preAddress : postAddress,
        decimal: !isBuy ? preDecimal : postDecimal,
        amountSwapped: Math.abs(!isBuy ? preBalance : postBalance),
      },
      {
        address: !isBuy ? postAddress : preAddress,
        decimal: !isBuy ? postDecimal : preDecimal,
        amountSwapped: Math.abs(!isBuy ? postBalance : preBalance),
      },
    ];
    if (isBuy && !BASE_ADDRESSES.includes(data2[0].address)) {
      data2 = data2.reverse();
    }
    let postBalance2 = 0;
    data.forEach((item) => {
      if (
        data.length > 2 &&
        item.address === data2[1].address &&
        postBalance2 != Math.abs(item.amountSwapped)
      ) {
        postBalance2 = Math.abs(postBalance2 + item.amountSwapped);
      }
    });
    data2[1].amountSwapped =
      postBalance2 > 0 ? postBalance2 : data2[1].amountSwapped;
    return {
      data: data2.filter((item) => item.address && item.address != ''),
      txType,
      isBuy,
    };
  };

  checkBuy = (amount: number): any => {
    if (amount > 0) {
      return true;
    }
    return false;
  };

  parseSwapTransaction2 = async (
    tx: ParsedTransactionWithMeta,
  ): Promise<any> => {
    const signer = tx.transaction.message.accountKeys[0].pubkey.toString();
    const preTokenBalances = tx?.meta?.preTokenBalances;
    const postTokenBalances = tx?.meta?.postTokenBalances;
    let lengMin = Math.min(preTokenBalances.length, postTokenBalances.length);
    let txType = '';
    let data = [];
    let data2 = [];
    let isBuy = null;
    const typeObj = {
      address: '',
      decimal: 0,
      amountSwapped: 0,
    };
    let dataBefore = typeObj;
    let dataAfter = typeObj;
    let dataOther = [];

    preTokenBalances.forEach((preBalance, index) => {
      if (index >= lengMin) {
        return;
      }
      const postBalance2 = postTokenBalances.find(
        (postBalance) => postBalance.accountIndex === preBalance.accountIndex,
      );
      const tokenAddress = preBalance?.mint;
      const preAmount = preBalance?.uiTokenAmount?.uiAmount;
      const postAmount = postBalance2?.uiTokenAmount?.uiAmount;
      const amountSwapped = postAmount - preAmount;

      if (
        amountSwapped !== 0 &&
        !this.checkAddress(ADDRESS_IGNORE, tokenAddress) &&
        !this.checkAddress(ADDRESS_IGNORE, preBalance?.owner)
      ) {
        data.push({
          address: tokenAddress,
          decimal: preBalance?.uiTokenAmount?.decimals,
          amountSwapped: amountSwapped,
          owner: preBalance?.owner,
        });
      }
    });
    // find token not (SOL, USDC, USDT)
    if (data.length == 2) {
      data.forEach((item) => {
        if (!this.checkAddress(ADDRESSES, item.address)) {
          dataBefore = {
            address: item.address,
            decimal: item.decimal,
            amountSwapped: Math.abs(item.amountSwapped),
          };
        } else {
          if (this.checkAddress(ADDRESSES, item.address)) {
            isBuy = this.checkBuy(item.amountSwapped);
            dataAfter = {
              address: item.address,
              decimal: item.decimal,
              amountSwapped: Math.abs(item.amountSwapped),
            };
          }
        }
      });
    } else {
      let data22 = [];
      data.forEach((item) => {
        if (item.address !== 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
          data22.push(item);
        }
      });
      data = data22;
      data.forEach((item) => {
        if (
          item.owner === signer &&
          !this.checkAddress(ADDRESSES, item.address)
        ) {
          isBuy = this.checkBuy(item.amountSwapped);

          dataBefore = {
            address: item.address,
            decimal: item.decimal,
            amountSwapped: Math.abs(item.amountSwapped),
          };
        } else {
          if (this.checkAddress(ADDRESSES, item.address)) {
            // SOL, USDC, USDT
            dataAfter = {
              address: item.address,
              decimal: item.decimal,
              amountSwapped:
                item.amountSwapped > 0
                  ? dataAfter.amountSwapped + item.amountSwapped
                  : Math.abs(item.amountSwapped) >
                      Math.abs(dataAfter.amountSwapped)
                    ? Math.abs(item.amountSwapped)
                    : dataAfter.amountSwapped,
            };
          } else {
            if (item.address === dataBefore.address) {
              dataBefore = {
                address: dataBefore.address,
                decimal: dataBefore.decimal,
                amountSwapped:
                  Math.abs(item.amountSwapped) >
                  Math.abs(dataBefore.amountSwapped)
                    ? Math.abs(item.amountSwapped)
                    : dataBefore.amountSwapped,
              };
            }
          }
        }
      });
    }
    data.forEach((item) => {
      if (
        item.address !== dataBefore.address &&
        item.address !== dataAfter.address &&
        !this.checkAddress(ADDRESSES, item.address)
      ) {
        dataOther.push({
          address: item.address,
          decimal: item.decimal,
          amountSwapped: item.amountSwapped,
        });
      }
    });

    isBuy
      ? (data2.push(dataAfter), data2.push(dataBefore))
      : (data2.push(dataBefore), data2.push(dataAfter));

    txType = data2.length > 1 ? 'swap' : 'transfer';
    if (dataOther.length > 0) {
      data2 = [];
    }

    return { data: data2, txType, isBuy };
  };

  checkAddress = (data: string[], address: string) => {
    return data.includes(address);
  };

  getTokenInfo = async (mintAddress2: string): Promise<any> => {
    const rpc = this.getRPC();
    const connection = new Connection(rpc);
    const metaplex = Metaplex.make(connection);
    const mintAddress = new PublicKey(mintAddress2);
    let symbol;
    let icon;
    let name;
    let decimals;
    let logoURI;
    let supply;

    const metadataAccount = metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintAddress });

    const metadataAccountInfo =
      await connection.getAccountInfo(metadataAccount);

    if (metadataAccountInfo) {
      const token = await metaplex
        .nfts()
        .findByMint({ mintAddress: mintAddress });
      symbol = token.symbol;
      icon = token.uri;
      name = token.name;
      decimals = token?.mint?.decimals;
      logoURI = token.uri;
      supply = Number(token?.mint.supply.basisPoints?.toString());
    } else {
      const provider = await new TokenListProvider().resolve();
      const tokenList = provider.filterByChainId(ENV.MainnetBeta).getList();
      const tokenMap = tokenList.reduce((map, item) => {
        map.set(item.address, item);
        return map;
      }, new Map());

      const token = tokenMap.get(mintAddress.toBase58());
      symbol = token?.symbol;
      icon = token?.uri;
      name = token?.name;
      decimals = token?.decimals;
    }
    return { symbol, icon, name, decimals, logoURI, supply };
  };

  async fillSolanaPriceToTransactions(
    parsedTransactions: IParsedTransaction[],
  ): Promise<IParsedTransaction[]> {
    const listBlockTimes = [
      ...new Set(
        parsedTransactions
          .filter((tx) => !tx.solanaPrice)
          .map((tx) => roundDate(tx.blockUnixTime, 'hour')),
      ),
    ];
    const solanaPrices = await this.priceRepository.getPrices(
      'SOL',
      listBlockTimes,
    );
    const priceSolMap = {};
    solanaPrices.forEach((price) => {
      priceSolMap[price.time.getTime()] = price.price;
    });
    parsedTransactions.forEach((tx) => {
      if (!tx.solanaPrice) {
        const solPrice =
          priceSolMap[roundDate(tx?.blockUnixTime, 'hour')?.getTime()];
        tx.solanaPrice = solPrice;
      }
    });
    return parsedTransactions;
  }

  async getWalletTransactions(
    address: string,
    limit: number = 100,
    isOnlyDB: boolean = false,
    tokenAddress?: string,
  ): Promise<IParsedTransaction[]> {
    const dBParsedTransactions =
      await this.transactionRepository.getParsedTransactionsBySigner(
        address,
        tokenAddress,
      );
    let transactions = [];
    const parsedTransactions = [];
    if (!isOnlyDB) {
      transactions = await this.getAllTransactionInWallet(
        address,
        limit,
        dBParsedTransactions?.[0]?.txHash,
      );
      const batchSize = 100;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        let parsedBatch = await Promise.all(
          batch.map((tx) => this.getParseTransactionSolana(tx.signature)),
        );
        parsedBatch = parsedBatch.filter((tx) => tx);
        parsedBatch = await this.fillSolanaPriceToTransactions(parsedBatch);
        if (parsedBatch.length) {
          this.queueService.persistTransactions(parsedBatch);
          parsedTransactions.push(...parsedBatch);
        }
      }
      console.log(
        `UPDATED New transactions of wallet ${address}:`,
        parsedTransactions.length,
      );
    }
    return [...parsedTransactions, ...dBParsedTransactions].sort(
      (a, b) => b.blockUnixTime.getTime() - a.blockUnixTime.getTime(),
    );
  }

  groupTransactionData(data: IParsedTransaction[]): IGroupedTransaction {
    return data.reduce((acc, tx) => {
      let tokenBalanceChange;
      let baseBalanceChange;
      if (BASE_ADDRESSES.includes(tx?.from?.address)) {
        tokenBalanceChange = tx?.to;
        baseBalanceChange = tx?.from;
        (acc?.[tx?.to?.address]?.totalBuyTransactions || 0) + 1;
      } else {
        tokenBalanceChange = tx?.from;
        baseBalanceChange = tx?.to;
      }
      if (tokenBalanceChange) {
        const parsedTokenAmount = tokenBalanceChange.uiAmount;
        const parsedUsdAmount =
          baseBalanceChange?.address === WRAPPED_SOLANA_ADDRESS
            ? baseBalanceChange?.uiAmount * tx.solanaPrice
            : baseBalanceChange?.uiAmount;
        const parsedSolAmount =
          baseBalanceChange?.address === WRAPPED_SOLANA_ADDRESS
            ? baseBalanceChange?.uiAmount
            : baseBalanceChange?.uiAmount / tx.solanaPrice;

        acc[tokenBalanceChange.address] = {
          name: tokenBalanceChange.name,
          address: tokenBalanceChange.address,
          symbol: tokenBalanceChange.symbol,
          totalToken:
            (acc?.[tokenBalanceChange.address]?.totalToken || 0) +
            Math.abs(parsedTokenAmount),
          totalSolana:
            (acc?.[tokenBalanceChange.address]?.totalSolana || 0) +
            Math.abs(parsedSolAmount),
          totalUSD:
            (acc?.[tokenBalanceChange.address]?.totalUSD || 0) +
            Math.abs(parsedUsdAmount),
          blockTimes: [
            ...(acc?.[tokenBalanceChange.address]?.blockTimes || []),
            tx.blockUnixTime,
          ],
          // TODO: should remove that after experiment
          ...(process.env.APP_ENV !== 'production' && {
            txhs: [
              ...(acc?.[tokenBalanceChange.address]?.txhs || []),
              tx.txHash,
            ],
            listSolana: [
              ...(acc?.[tokenBalanceChange.address]?.listSolana || []),
              Math.abs(parsedSolAmount),
            ],
          }),
        };
      }
      return acc;
    }, {});
  }

  async groupTransactionOfWallet(
    address: string,
    limit: number = 200,
    isOnlyDB: boolean = false,
  ) {
    const transactions = await this.getWalletTransactions(
      address,
      limit,
      isOnlyDB,
    );
    // TODO: should write materialized view
    const allSellTransactions = transactions.filter(
      (tx) =>
        BASE_ADDRESSES.includes(tx?.to?.address) && tx?.to?.uiAmount > 0.0001,
    );
    const allBuyTransactions = transactions.filter(
      (tx) =>
        BASE_ADDRESSES.includes(tx?.from?.address) &&
        tx?.from?.uiAmount > 0.0001,
    );
    console.log(
      `======== FETCHED ${allBuyTransactions.length} buy transactions and ${allSellTransactions.length} sell transactions of ${address}`,
    );
    const sell = this.groupTransactionData(allSellTransactions);
    const buy = this.groupTransactionData(allBuyTransactions);
    return { buy, sell };
  }

  async groupTransactionOfWalletAndToken(
    address: string,
    tokenAddress: string,
  ) {
    const transactions = await this.getWalletTransactions(
      address,
      undefined,
      true,
      tokenAddress,
    );
    // TODO: should write materialized view
    const allSellTransactions = transactions.filter(
      (tx) =>
        BASE_ADDRESSES.includes(tx?.to?.address) && tx?.to?.uiAmount > 0.0001,
    );
    const allBuyTransactions = transactions.filter(
      (tx) =>
        BASE_ADDRESSES.includes(tx?.from?.address) &&
        tx?.from?.uiAmount > 0.0001,
    );
    console.log(
      `======== FETCHED ${allBuyTransactions.length} buy transactions and ${allSellTransactions.length} sell transactions of ${address}`,
    );
    const sell = this.groupTransactionData(allSellTransactions);
    const buy = this.groupTransactionData(allBuyTransactions);
    return { buy, sell };
  }
}
