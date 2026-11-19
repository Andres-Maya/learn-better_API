import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/role.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmailWithPassword: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let user: User;

  beforeAll(async () => {
    user = {
      id: 'user-1',
      email: 'admin@colegio.edu.co',
      passwordHash: await hash('CambiaEsto123', 4),
      role: Role.ADMIN,
      studentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  beforeEach(() => {
    usersService = { findByEmailWithPassword: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('devuelve el token y el usuario sin la contraseña', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(user);

    const response = await service.login({
      email: user.email,
      password: 'CambiaEsto123',
    });

    expect(response.accessToken).toBe('signed-token');
    expect(response.user).toMatchObject({ id: 'user-1', role: Role.ADMIN });
    expect(response.user).not.toHaveProperty('passwordHash');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: user.email,
      role: Role.ADMIN,
    });
  });

  it('lanza 401 si la contraseña es incorrecta', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(user);

    await expect(
      service.login({ email: user.email, password: 'otra-clave' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('lanza 401 si el correo no existe', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nadie@colegio.edu.co', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
