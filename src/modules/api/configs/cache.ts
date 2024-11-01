import { registerAs } from '@nestjs/config';

export const configCache = registerAs('cache', () => ({
  api: {
    cache_ttl: 3000,
  },
}));
