import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/role.enum';

export const ROLES_KEY = 'roles';

// Routes without @Roles() are open to any authenticated user.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
