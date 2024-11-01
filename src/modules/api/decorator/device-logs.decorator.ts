import { TDevice } from '@/shared/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const DeviceLogsDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TDevice => {
    const request = ctx.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'];
    const ip =
      (request?.headers['x-forwarded-for'] || '').split(',')[0] ||
      request.ip ||
      'unknown';
    return {
      ip,
      user_agent: userAgent,
    };
  },
);
