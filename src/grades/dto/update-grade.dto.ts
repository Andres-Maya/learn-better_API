import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateGradeDto } from './create-grade.dto';

export class UpdateGradeDto extends PartialType(
  OmitType(CreateGradeDto, ['studentId', 'areaId'] as const),
) {}
