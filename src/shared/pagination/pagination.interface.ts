import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export interface IPaginateRequest {
  take?: number;
  page?: number;
}

export class PaginationResponse {
  @ApiPropertyOptional()
  @Expose()
  total?: number;

  @ApiPropertyOptional()
  @Expose()
  current_page?: number;

  @ApiPropertyOptional()
  @Expose()
  total_pages?: number;

  @ApiPropertyOptional()
  @Expose()
  take?: number;
}
