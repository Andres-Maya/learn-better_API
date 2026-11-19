import { ForbiddenException } from '@nestjs/common';
import { Role } from '../users/role.enum';
import { AuthenticatedUser } from './jwt-payload';
import { assertCanAccessStudent, ownStudentId } from './student-access';

const OWN = 'student-own';
const OTHER = 'student-other';

function userWith(role: Role, studentId: string | null): AuthenticatedUser {
  return { id: 'user-1', email: 'u@colegio.edu.co', role, studentId };
}

describe('assertCanAccessStudent', () => {
  it.each([Role.ADMIN, Role.TEACHER])(
    '%s puede ver cualquier estudiante',
    (role) => {
      expect(() =>
        assertCanAccessStudent(userWith(role, null), OTHER),
      ).not.toThrow();
    },
  );

  it('un STUDENT puede ver su propia información', () => {
    expect(() =>
      assertCanAccessStudent(userWith(Role.STUDENT, OWN), OWN),
    ).not.toThrow();
  });

  it('un STUDENT no puede ver la de otro estudiante', () => {
    expect(() =>
      assertCanAccessStudent(userWith(Role.STUDENT, OWN), OTHER),
    ).toThrow(ForbiddenException);
  });

  it('un STUDENT sin estudiante enlazado no puede ver nada', () => {
    expect(() =>
      assertCanAccessStudent(userWith(Role.STUDENT, null), OWN),
    ).toThrow(ForbiddenException);
  });
});

describe('ownStudentId', () => {
  it('no limita a ADMIN ni a TEACHER', () => {
    expect(ownStudentId(userWith(Role.ADMIN, null))).toBeUndefined();
    expect(ownStudentId(userWith(Role.TEACHER, null))).toBeUndefined();
  });

  it('limita a un STUDENT a su propio estudiante', () => {
    expect(ownStudentId(userWith(Role.STUDENT, OWN))).toBe(OWN);
  });

  it('lanza 403 si el STUDENT no está enlazado a un estudiante', () => {
    expect(() => ownStudentId(userWith(Role.STUDENT, null))).toThrow(
      ForbiddenException,
    );
  });
});
