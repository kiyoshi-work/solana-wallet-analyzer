import { DataSource, In, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { PriceEntity } from '../entities/price.entity';
import { roundDate } from '@/shared/helper';

export class PriceRepository extends Repository<PriceEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(PriceEntity, dataSource.createEntityManager());
  }

  async getLastTime(symbol: string) {
    const lastPriceTime = await this.findOne({
      where: { symbol },
      order: {
        time: 'DESC',
      },
    });
    return new Date(lastPriceTime?.time || '2020-01-01 00:00:00');
  }

  async getPrice(symbol: string = 'SOL', time: Date = new Date()) {
    const price = await this.findOne({
      where: { symbol, time: roundDate(time, 'hour') },
    });
    return price?.price || 0;
  }

  async getPrices(symbol: string = 'SOL', times: Date[]) {
    const prices = await this.find({
      where: { symbol, time: In(times) },
      select: ['price', 'time'],
    });
    return prices;
  }

  async getATHTokenPrice(
    // tokenAddress: string,
    from: Date,
    to: Date = new Date(),
  ) {
    const [bound, ath] = await Promise.all([
      this.createQueryBuilder('price')
        // .where('price.address = :address', {
        //   address: tokenAddress,
        // })
        .andWhere('price.time BETWEEN :from AND :to', {
          from: from,
          to: to,
        })
        .select(['MAX(price.time) as lastest', 'MIN(price.time) as earliest'])
        .getRawOne(),
      this.createQueryBuilder('price')
        // .where('price.address = :address', {
        //   address: tokenAddress,
        // })
        .andWhere('price.time BETWEEN :from AND :to', {
          from: from,
          to: to,
        })
        .select(['price.price', 'price.time'])
        .orderBy('price', 'DESC')
        .getOne(),
    ]);
    return {
      lastest: bound?.lastest,
      earliest: bound?.earliest,
      ath: ath?.price,
      athUnixTime: ath?.time,
    };
  }
}
