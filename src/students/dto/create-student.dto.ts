import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateStudentDto {
  /** @example 'Laura' */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  /** @example 'Gómez' */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  /** @example 'laura.gomez@colegio.edu.co' */
  @IsOptional()
  @IsEmail()
  email?: string;

  /** @example '9A' */
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  gradeLevel: string;
}
