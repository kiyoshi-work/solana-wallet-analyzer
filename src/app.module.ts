import { Module, RequestMethod } from '@nestjs/common';
import { ApiModule } from '@/api';
import { WorkerModule } from '@/worker/worker.module';
import { CrawlerModule } from '@/crawler/crawler.module';
import { LoggerModule } from 'nestjs-pino';
import { ResilienceModule } from 'nestjs-resilience';

const isApi = Boolean(Number(process.env.IS_API || 0));
const isWorker = Boolean(Number(process.env.IS_WORKER || 0));

let _modules = [];
if (isApi) {
  _modules = [..._modules, ApiModule];
}
if (isWorker) {
  _modules = [..._modules, WorkerModule];
}
@Module({
  imports: [
    ..._modules,
    CrawlerModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.APP_ENV === 'production' ? 'info' : 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            ignore: 'pid,hostname',
            messageFormat: '{msg}',
            translateTime: 'SYS:standard',
          },
        },
        // serializers: {
        //   req: () => undefined,
        //   res: () => undefined,
        // },
        customProps: (req, res) => ({
          context: 'HTTP',
          ignoreLogging: true,
        }),
        customSuccessMessage: (req, res) => {
          if (req && res) {
            return `${req.method} ${req.url}`;
          }
          return 'Request completed';
        },
        customErrorMessage: (req, res, error) => {
          if (req) {
            return `${req.method} ${req.url} failed with error: ${error.message}`;
          }
          return 'Request failed';
        },
      },
      exclude: [{ method: RequestMethod.ALL, path: 'health' }],
    }),
    ResilienceModule.forRoot({}),
  ],
  controllers: [],
  providers: [],
})

export class AppModule {}
