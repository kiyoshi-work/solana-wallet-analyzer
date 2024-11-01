import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportDTO } from '../dtos/report.dto';
import { DeviceLogsDecorator } from '../decorator/device-logs.decorator';
import { TDevice } from '@/shared/types';
import { UserReportRepository } from '@/database/repositories';
import { CustomThrottlerGuard } from '../guards/custom-throttler.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private readonly userReportRepository: UserReportRepository) {}

  @UseGuards(CustomThrottlerGuard)
  @Throttle(10, 60)
  @Post()
  async report(
    @Body() data: ReportDTO,
    @DeviceLogsDecorator() device: TDevice,
  ) {
    await this.userReportRepository.report(
      data.address,
      data.token_address,
      device.ip,
    );
    return true;
  }
}
