import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { MAX_PERIOD, MIN_PERIOD } from '../grade-scale';

export class FilterGradesDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  areaId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PERIOD)
  @Max(MAX_PERIOD)
  period?: number;
}
