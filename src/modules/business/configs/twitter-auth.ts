import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export const configTwitterAuth = registerAs('twitter_auth', () => ({
  client_id: process.env.TWITTER_CLIENT_ID,
  client_secret: process.env.TWITTER_CLIENT_SECRET,
  callback: process.env.TWITTER_CALLBACK,
  api_url: process.env.TWITTER_API_URL || 'https://api.twitter.com/oauth',
}));
