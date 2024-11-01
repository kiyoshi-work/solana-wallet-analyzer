import { PaginationResponse } from '@/shared/pagination/pagination.interface';
import { HttpStatus } from '@nestjs/common';
import { Expose } from 'class-transformer';

export class BaseResponse<T> {
  @Expose()
  data: T;

  @Expose()
  msg: string;

  @Expose({ name: 'status_code' })
  status_code: number;

  @Expose({ name: 'timestamp' })
  timestamp: string;

  @Expose({ name: 'pagination' })
  pagination?: PaginationResponse;

  constructor(
    data: T,
    statusCode: number = HttpStatus.OK,
    message?: string,
    pagination?: PaginationResponse,
  ) {
    this.msg = message || '';
    this.data = data;
    this.status_code = statusCode;
    this.timestamp = new Date().toISOString();

    if (pagination) {
      this.pagination = pagination;
    }
  }
}
