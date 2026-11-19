import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Only the fields sent are changed. A new password is stored hashed.
export class UpdateUserDto extends PartialType(CreateUserDto) {}
