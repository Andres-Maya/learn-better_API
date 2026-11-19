import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /** @example 'CambiaEsto123' */
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword: string;

  /** @example 'MiNuevaClave2026' */
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt ignores everything after 72 bytes.
  newPassword: string;
}
