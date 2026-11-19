import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGradeDto } from './create-grade.dto';

export class UpdateGradeDto extends PartialType(
  OmitType(CreateGradeDto, ['studentId', 'areaId'] as const),
) {}
