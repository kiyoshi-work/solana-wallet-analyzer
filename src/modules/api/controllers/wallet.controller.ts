import {
  Controller,
  Get,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CustomThrottlerGuard } from '../guards/custom-throttler.guard';
import { CacheTTL } from '@nestjs/cache-manager';
import {
  FormatResponseInterceptor,
  HttpCacheInterceptor,
} from '../interceptors';
import { ResponseMessage } from '@/shared/decorators/response-message.decorator';
import { ApiBaseResponse } from '@/shared/swagger/decorator/api-response.decorator';
import { ITokenGainedResponse } from '@/business/interfaces/wallet.interface';
import { WalletService } from '@/business/services/wallet.service';
import { SolanaAddress } from '@/api/decorator/solana-address.decorator';
import { TDevice } from '@/shared/types';
import { DeviceLogsDecorator } from '../decorator/device-logs.decorator';
import { DeviceLogRepository } from '@/database/repositories';

@ApiTags('Wallets')
@Controller('wallets')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly deviceLogRepository: DeviceLogRepository,
  ) {}
  @ApiBaseResponse(ITokenGainedResponse, {
    statusCode: HttpStatus.OK,
    isArray: true,
    isPaginate: false,
  })
  @ResponseMessage('Get gained successfully')
  @UseInterceptors(FormatResponseInterceptor)
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(10000)
  @UseGuards(CustomThrottlerGuard)
  @Throttle(20, 60)
  @Get('/:user_address/gained')
  async gained(
    @SolanaAddress() user_address: string,
    @DeviceLogsDecorator() device: TDevice,
  ) {
    this.deviceLogRepository
      .log(user_address, device.ip)
      .then(() => {
        console.log('Logged gained request');
      })
      .catch((err) => {
        console.log(err);
      });
    return await this.walletService.gained(user_address);
  }

  @Get('aggregate')
  async aggregate() {
    return await this.walletService.aggregate();
  }
}
