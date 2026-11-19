import { OmitType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

// A user as the API returns it: never with the password hash.
export class PublicUserDto extends OmitType(User, [
  'passwordHash',
  'student',
] as const) {}
