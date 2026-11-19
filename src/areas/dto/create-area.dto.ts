import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAreaDto {
  /** @example 'Matemáticas' */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  /** @example 'Álgebra, geometría y estadística' */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
