import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] || req.ip;
  }
}
