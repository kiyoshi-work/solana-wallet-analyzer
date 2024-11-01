import { registerAs } from '@nestjs/config';
export const configCrawler = registerAs('crawler', () => ({
  scraper_api: {
    key: process.env.SCRAPER_API_KEY || '62339580',
    host: process.env.SCRAPER_API_HOST || 'proxy-server.scraperapi.com',
    // port: process.env.SCRAPER_API_PORT || 5000,
    // username:
    //   process.env.SCRAPER_API_USERNAME ||
    //   'scraperapi.device_type=desktop.premium=true.country_code=us',
  },
  birdeye: {
    api_key:
      process.env.BIRDEYE_API_KEY || 'b5b7b6b6-4d5d-4b7d-9b5b-2b5b7b7b7b7b',
    base_url: process.env.BIRDEYE_BASE_URL || 'https://public-api.birdeye.so',
  },
  coingecko: {
    // host: process.env.COINGECKO_HOST || 'https://pro-api.coingecko.com/api/v3',
    host: process.env.COINGECKO_HOST || 'https://api.coingecko.com/api/v3',
    api_key: process.env.COINGECKO_API_KEY,
  },
}));
