import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AdminConfigRepository, UserRepository } from '../repositories';

@Injectable()
export class SeedDatabase implements OnApplicationBootstrap {
  @Inject(UserRepository)
  private readonly userRepository: UserRepository;

  constructor(private readonly adminConfigRepository: AdminConfigRepository) {}

  async onApplicationBootstrap() {
    const isApi = Boolean(Number(process.env.IS_API || 0));
    if (!isApi) {
      return;
    }
    const start = Date.now();
    if (
      !(await this.adminConfigRepository.exists({
        where: {
          key: 'sync_sol_price',
        },
      }))
    ) {
      await this.adminConfigRepository.save({
        key: 'sync_sol_price',
        value: 'end',
      });
    }

    if (
      !(await this.adminConfigRepository.exists({
        where: {
          key: 'update_solana_price_in_transactions',
        },
      }))
    ) {
      await this.adminConfigRepository.save({
        key: 'update_solana_price_in_transactions',
        value: 'end',
      });
    }

    const end = Date.now();

    console.log('Time to seed database', (end - start) / 1000);

    console.log('-----------SEED DATABASE SUCCESSFULLY----------------');
  }
}
