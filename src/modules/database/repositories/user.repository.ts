import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserEntity } from '@/database/entities';

export class UserRepository extends Repository<UserEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }
  async findOneById(
    id: string,
    relations: 'twitter_user'[] = [],
  ): Promise<UserEntity> {
    let query = this.createQueryBuilder('user').where('user.id = :id', {
      id,
    });
    for (const relation of relations) {
      query = query.leftJoinAndSelect(`user.${relation}`, relation);
    }
    return query.limit(1).getOne();
  }
}
