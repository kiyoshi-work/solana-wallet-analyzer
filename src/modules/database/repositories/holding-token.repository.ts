import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HoldingTokenEntity } from '../entities/holding-token.entity';

export class HoldingTokenRepository extends Repository<HoldingTokenEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(HoldingTokenEntity, dataSource.createEntityManager());
  }
}
