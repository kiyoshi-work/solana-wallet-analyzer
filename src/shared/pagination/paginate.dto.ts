import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { IPaginateRequest } from './pagination.interface';
import {
  MAX_PAGINATION_TAKEN,
  MIN_PAGINATION_TAKEN,
  PAGINATION_TAKEN,
} from './constants';

export enum ESortType {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginateDto implements IPaginateRequest {
  @ApiPropertyOptional({
    name: 'take',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Max(MAX_PAGINATION_TAKEN)
  @Min(MIN_PAGINATION_TAKEN)
  take?: number = PAGINATION_TAKEN;

  @ApiPropertyOptional({
    name: 'page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  sort_field: string = 'created_at';

  @ApiPropertyOptional({
    type: 'enum',
    enum: ESortType,
  })
  @IsOptional()
  sort_type: ESortType = ESortType.DESC;
}
