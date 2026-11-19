import { Role } from '../users/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

// What the guards attach to request.user once the token is verified.
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  studentId: string | null;
}
