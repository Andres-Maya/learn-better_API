import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FilterStudentsDto extends PaginationQueryDto {
  /**
   * Busca en nombre, apellido o correo, sin importar mayúsculas.
   * @example 'gómez'
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  search?: string;

  /** @example '9A' */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gradeLevel?: string;
}
