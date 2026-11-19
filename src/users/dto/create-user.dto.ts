import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../role.enum';

export class CreateUserDto {
  /** @example 'docente@colegio.edu.co' */
  @IsEmail()
  @MaxLength(255)
  email: string;

  /** @example 'Docente123' */
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt ignores everything after 72 bytes.
  password: string;

  /** @example 'TEACHER' */
  @IsEnum(Role)
  role: Role;

  // Required when role is STUDENT, rejected for the other roles.
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
