import { DataSource, In, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { roundDate } from '@/shared/helper';
import { TokenPriceEntity } from '../entities/token-price.entity';

export class TokenPriceRepository extends Repository<TokenPriceEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(TokenPriceEntity, dataSource.createEntityManager());
  }

  async getATHTokenPrice(
    tokenAddress: string,
    from: Date,
    to: Date = new Date(),
  ) {
    const [bound, ath] = await Promise.all([
      this.createQueryBuilder('price')
        .where('price.address = :address', {
          address: tokenAddress,
        })
        .andWhere('price.time BETWEEN :from AND :to', {
          from: from,
          to: to,
        })
        .select(['MAX(price.time) as lastest', 'MIN(price.time) as earliest'])
        .getRawOne(),
      this.createQueryBuilder('price')
        .where('price.address = :address', {
          address: tokenAddress,
        })
        .andWhere('price.time BETWEEN :from AND :to', {
          from: from,
          to: to,
        })
        .select(['price.price', 'price.time'])
        .orderBy('price', 'DESC')
        .getOne(),
    ]);
    return {
      lastest: bound?.lastest as Date,
      earliest: bound?.earliest as Date,
      ath: ath?.price,
      athUnixTime: ath?.time,
    };
  }

  async saveListTokenPrice(
    address: string,
    data: { price: number; time: Date }[],
  ) {
    await this.upsert(
      data.filter((d) => d.price).map((d) => ({ ...d, address })),
      {
        conflictPaths: ['time'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
  }
}
