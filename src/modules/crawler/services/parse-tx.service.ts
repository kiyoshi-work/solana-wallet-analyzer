import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseRequestService } from './base-request.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  BASE_ADDRESSES,
  IParsedTransaction,
} from '@/blockchain/services/solana.service';

@Injectable()
export class ParseTxService extends BaseRequestService {
  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(ParseTxService.name)
    private readonly logger: PinoLogger,
  ) {
    super(configService.get<string>('crawler.parsetx.host'));
  }

  async parseSwap(txhash: string): Promise<IParsedTransaction> {
    const url = `/parse-swap`;
    try {
      const response = await this.sendRequest({
        method: 'GET',
        url: url,
        params: {
          signature: txhash,
        },
      });
      return {
        signer: undefined,
        txHash: txhash,
        blockUnixTime: undefined,
        side: BASE_ADDRESSES.includes(response?.['TokenInMint'])
          ? 'buy'
          : 'sell',
        from: {
          address: response?.['TokenInMint'],
          decimals: response?.['TokenInDecimals'],
          uiAmount:
            response?.['TokenInAmount'] / 10 ** response?.['TokenInDecimals'],
        },
        to: {
          address: response?.['TokenOutMint'],
          decimals: response?.['TokenOutDecimals'],
          uiAmount:
            response?.['TokenOutAmount'] / 10 ** response?.['TokenOutDecimals'],
        },
      } as IParsedTransaction;
    } catch (error) {
      this.logger.error('[ParseTxService] [parseSwap]', error);
    }
  }
}
