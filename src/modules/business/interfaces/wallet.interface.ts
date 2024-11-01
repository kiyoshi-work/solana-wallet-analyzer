import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ITokenGainedResponse {
  @ApiPropertyOptional()
  logoURI: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  totalSellToken: number;

  @ApiProperty()
  totalSellSolana: number;

  @ApiProperty()
  avgSellPrice: number;

  @ApiProperty()
  totalBuyToken: number;

  @ApiProperty()
  totalBuySolana: number;

  @ApiProperty()
  avgBuyPrice: number;

  // @ApiProperty()
  // holdTime: number;

  @ApiProperty()
  solanaPrice: number;

  @ApiProperty()
  boughtAtMCC: number;

  @ApiProperty()
  soldAtMCC: number;

  @ApiProperty()
  pnl: number;

  @ApiProperty()
  pnlPercent: number;
}
