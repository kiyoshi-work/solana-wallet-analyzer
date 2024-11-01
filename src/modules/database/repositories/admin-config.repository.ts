import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { AdminConfigEntity } from '../entities/admin-config.entity';

export class AdminConfigRepository extends Repository<AdminConfigEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(AdminConfigEntity, dataSource.createEntityManager());
  }
  async findOneByKey(key: string): Promise<AdminConfigEntity> {
    return this.createQueryBuilder('admin-configs')
      .where('admin-configs.key = :key', { key })
      .limit(1)
      .getOne();
  }
}
