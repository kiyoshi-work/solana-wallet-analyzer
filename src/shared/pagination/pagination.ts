import { SelectQueryBuilder } from 'typeorm';
import { PaginationResponse } from './pagination.interface';
import { PAGINATION_TAKEN } from './constants';

export interface IGetPaginationResponse<T> {
  data: T;
  pagination: PaginationResponse;
}

export function getOffset(take: number = PAGINATION_TAKEN, page?: number) {
  if (page && page > 0) {
    return take * page - take;
  }
  return 0;
}

// NOTE: for paging
export const paginate = async (
  queryBuilder: SelectQueryBuilder<any>,
  page: number,
  take?: number,
  isRaw = false,
): Promise<IGetPaginationResponse<any>> => {
  if (take == -1) {
    const data = isRaw
      ? await queryBuilder.getRawMany()
      : await queryBuilder.getMany();
    return {
      pagination: {
        current_page: 0,
        total_pages: 0,
        take: 0,
        total: 0,
      },
      data: data,
    };
  }
  page = page ? page : 1;
  take = take ? take : PAGINATION_TAKEN;
  const total = await queryBuilder.getCount();
  let result;
  if (isRaw) {
    result = await queryBuilder
      .offset(getOffset(take, page))
      .limit(Number(take))
      .getRawMany();
  } else {
    result = await queryBuilder
      .skip(getOffset(take, page))
      .take(Number(take))
      .getMany();
  }
  return {
    pagination: {
      current_page: page,
      total_pages: Math.ceil(total / take),
      take: take,
      total: total,
    },
    data: result,
  };
};
