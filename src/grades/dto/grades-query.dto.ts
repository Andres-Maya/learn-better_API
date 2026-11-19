import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { FilterGradesDto } from './filter-grades.dto';

export class GradesQueryDto extends IntersectionType(
  FilterGradesDto,
  PaginationQueryDto,
) {}
