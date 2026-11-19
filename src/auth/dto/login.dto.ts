import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  /** @example 'admin@colegio.edu.co' */
  @IsEmail()
  email: string;

  /** @example 'CambiaEsto123' */
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
