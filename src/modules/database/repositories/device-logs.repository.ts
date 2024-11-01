import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DeviceLogEntity } from '../entities/device-log.entity';

export class DeviceLogRepository extends Repository<DeviceLogEntity> {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super(DeviceLogEntity, dataSource.createEntityManager());
  }

  async findOneByUnique(address: string, ip: string) {
    const query = this.createQueryBuilder('device_logs')
      .where('device_logs.address = :address', {
        address,
      })
      .andWhere('device_logs.ip = :ip', {
        ip,
      });
    return query.limit(1).getOne();
  }

  async log(address: string, ip: string) {
    const log = await this.findOneByUnique(address, ip);
    if (log) {
      await this.update(
        {
          id: log.id,
        },
        {
          num_request: log.num_request + 1,
        },
      );
    } else {
      await this.save({
        address: address,
        ip: ip,
        num_request: 1,
      });
    }
  }
}
