import { registerAs } from '@nestjs/config';

export const configBlockchain = registerAs('blockchain', () => ({
  isGlobal: true,
  mainnet: Boolean(Number(process.env.IS_MAINNET || 0) == 1),
}));
