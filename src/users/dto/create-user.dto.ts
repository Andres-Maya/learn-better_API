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
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt ignores everything after 72 bytes.
  password: string;

  @IsEnum(Role)
  role: Role;

  // Required when role is STUDENT, rejected for the other roles.
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
