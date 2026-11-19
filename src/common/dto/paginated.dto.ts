import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from './pagination-query.dto';

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function toPage<T>(
  [data, total]: [T[], number],
  { page, limit }: PaginationQueryDto,
): Page<T> {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// TypeORM options for the requested page.
export function pageOptions({ page, limit }: PaginationQueryDto): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * limit, take: limit };
}

// Builds a documented response class, e.g. class PaginatedStudentsDto extends Paginated(Student).
export function Paginated<T>(itemType: Type<T>): Type<Page<T>> {
  class PaginatedResponse implements Page<T> {
    @ApiProperty({ type: [itemType] })
    data: T[];

    @ApiProperty({ description: 'Total de registros que cumplen el filtro' })
    total: number;

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 1 })
    totalPages: number;
  }
  Object.defineProperty(PaginatedResponse, 'name', {
    value: `Paginated${itemType.name}`,
  });
  return PaginatedResponse;
}
