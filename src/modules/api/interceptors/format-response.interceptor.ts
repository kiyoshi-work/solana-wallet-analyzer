import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { BaseResponse } from '@/shared/swagger/response/base.response';
import { PaginationResponse } from '@/shared/pagination/pagination.interface';
import { plainToInstance } from 'class-transformer';
import { ResponseMessageKey } from '@/shared/decorators/response-message.decorator';

interface Response<T> {
  msg: string;
  status_code: number;
  data: T;
}

@Injectable()
export class FormatResponseInterceptor<T>
  implements NestInterceptor<T, BaseResponse<T>>
{
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponse<T>> {
    const responseMessage =
      this.reflector.get<string>(ResponseMessageKey, context.getHandler()) ??
      '';
    return next.handle().pipe(
      //   map((data: ResponseTemplate<T>) => {
      map((data: any) => {
        if (
          data?.pagination &&
          Object.keys(
            plainToInstance(PaginationResponse, data?.pagination, {
              strategy: 'excludeAll',
            }),
          ).length
        ) {
          return new BaseResponse(
            data?.data,
            context
              .switchToHttp()
              .getResponse<{ statusCode: number }>().statusCode,
            responseMessage,
            data?.pagination,
          );
        } else {
          return new BaseResponse(
            data,
            context
              .switchToHttp()
              .getResponse<{ statusCode: number }>().statusCode,
            responseMessage,
          );
        }
        // return {
        //   //   msg: data?.message,
        //   msg: responseMessage,
        //   status_code: context
        //     .switchToHttp()
        //     .getResponse<{ statusCode: number }>().statusCode,
        //   data: data,
        // };
      }),
    );
  }
}
