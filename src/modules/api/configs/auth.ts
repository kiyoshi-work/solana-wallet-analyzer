import { registerAs } from '@nestjs/config';

export const configAuth = registerAs('auth', () => ({
  jwt: {
    jwt_secret_key: process.env.JWT_SECRET_KEY || 'jwt-secret',
    access_token_lifetime: 60 * 60 * 24 * 7,
  },
}));
