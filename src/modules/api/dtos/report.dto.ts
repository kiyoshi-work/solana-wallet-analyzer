import { ApiProperty } from '@nestjs/swagger';
import { IsSolanaAddress } from '../decorator/is-solana-address.decorator';

export class ReportDTO {
  @ApiProperty()
  @IsSolanaAddress()
  address: string;

  @ApiProperty()
  @IsSolanaAddress()
  token_address: string;
}
