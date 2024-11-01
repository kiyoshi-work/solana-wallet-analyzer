import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserReportEntity } from '../entities/user-report.entity';

export class UserReportRepository extends Repository<UserReportEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(UserReportEntity, dataSource.createEntityManager());
  }

  async findOneByUnique(
    address: string,
    token_address: string,
    ip: string,
  ): Promise<UserReportEntity> {
    const query = this.createQueryBuilder('user_reports')
      .where('user_reports.address = :address', {
        address,
      })
      .andWhere('user_reports.token_address = :token_address', {
        token_address,
      })
      .andWhere('user_reports.ip = :ip', {
        ip,
      });
    return query.limit(1).getOne();
  }

  async report(address: string, token_address: string, ip: string) {
    const report = await this.findOneByUnique(address, token_address, ip);
    if (report) {
      await this.update(
        {
          id: report.id,
        },
        {
          num_report: report.num_report + 1,
        },
      );
    } else {
      await this.save({
        address: address,
        ip: ip,
        token_address: token_address,
        num_report: 1,
      });
    }
  }
}
