import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/role.enum';
import { AuthenticatedUser } from '../jwt-payload';
import { RolesGuard } from './roles.guard';

function contextFor(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function userWith(role: Role): AuthenticatedUser {
  return { id: 'user-1', email: 'u@colegio.edu.co', role, studentId: null };
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('deja pasar a cualquier usuario si la ruta no tiene @Roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextFor(userWith(Role.STUDENT)))).toBe(true);
  });

  it('deja pasar si el rol del usuario está permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.TEACHER]);

    expect(guard.canActivate(contextFor(userWith(Role.TEACHER)))).toBe(true);
  });

  it('lanza 403 si el rol del usuario no está permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(contextFor(userWith(Role.TEACHER)))).toThrow(
      ForbiddenException,
    );
  });

  it('lanza 403 si no hay usuario en la petición', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(contextFor())).toThrow(ForbiddenException);
  });
});
