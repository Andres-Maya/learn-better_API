import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_PERIOD, MAX_SCORE, MIN_PERIOD, MIN_SCORE } from '../grade-scale';

export class CreateGradeDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  areaId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(MIN_SCORE)
  @Max(MAX_SCORE)
  score: number;

  @IsInt()
  @Min(MIN_PERIOD)
  @Max(MAX_PERIOD)
  period: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
