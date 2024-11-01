import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor() {}

  @Get('')
  async healthCheck() {
    return 1;
  }
}
