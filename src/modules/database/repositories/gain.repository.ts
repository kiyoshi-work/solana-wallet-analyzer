import { DataSource, In, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { GainEntity } from '../entities/gain.entity';

export class GainRepository extends Repository<GainEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(GainEntity, dataSource.createEntityManager());
  }
}
