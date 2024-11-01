import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import SHA256 from 'crypto-js/sha256';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';
    const excludePaths = [
      // Routes to be excluded
    ];
    if (
      !isGetRequest ||
      (isGetRequest &&
        excludePaths.includes(httpAdapter.getRequestUrl(request)))
    ) {
      return undefined;
    }
    const { query } = context.getArgByIndex(0);
    const hash = SHA256(
      JSON.stringify({
        query,
        headers: { authorization: request?.headers?.authorization },
      }),
    ).toString();
    return `${httpAdapter.getRequestUrl(request)}_${hash}`;
  }
}
