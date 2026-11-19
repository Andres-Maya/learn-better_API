import { ForbiddenException } from '@nestjs/common';
import { Role } from '../users/role.enum';
import { AuthenticatedUser } from './jwt-payload';

// ADMIN and TEACHER can see every student; a STUDENT only their own data.
export function assertCanAccessStudent(
  user: AuthenticatedUser,
  studentId: string,
): void {
  if (user.role !== Role.STUDENT) {
    return;
  }
  if (user.studentId === null || user.studentId !== studentId) {
    throw new ForbiddenException('Solo puedes consultar tu propia información');
  }
}

// Returns the student a STUDENT user is limited to, or undefined for the other roles.
export function ownStudentId(user: AuthenticatedUser): string | undefined {
  if (user.role !== Role.STUDENT) {
    return undefined;
  }
  if (user.studentId === null) {
    throw new ForbiddenException('Tu usuario no está enlazado a un estudiante');
  }
  return user.studentId;
}
