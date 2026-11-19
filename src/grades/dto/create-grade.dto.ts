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
  /** @example '3f6c1d2a-8b4e-4c1a-9f2d-1a2b3c4d5e6f' */
  @IsUUID()
  studentId: string;

  /** @example '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d' */
  @IsUUID()
  areaId: string;

  /** @example 4.2 */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(MIN_SCORE)
  @Max(MAX_SCORE)
  score: number;

  /** @example 2 */
  @IsInt()
  @Min(MIN_PERIOD)
  @Max(MAX_PERIOD)
  period: number;

  /** @example 'Evaluación de fracciones' */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
