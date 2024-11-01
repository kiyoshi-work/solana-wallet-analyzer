import { DataSource, In, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { TokenEntity } from '../entities/token.entity';

export class TokenRepository extends Repository<TokenEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(TokenEntity, dataSource.createEntityManager());
  }

  async getTokenInfoByAddresses(address: string[]) {
    const tokens = await this.find({
      where: {
        address: In(address),
      },
      select: [
        'address',
        'name',
        'symbol',
        'decimals',
        'logoURI',
        'supply',
        'social_link',
      ],
    });
    return tokens;
  }
}
