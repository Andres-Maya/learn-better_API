import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { StudentsService } from '../students/students.service';
import { User } from './entities/user.entity';
import { Role } from './role.enum';
import { UsersService } from './users.service';

const STUDENT_ID = '3f6c1d2a-8b4e-4c1a-9f2d-1a2b3c4d5e6f';

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    existsBy: jest.Mock;
    findOneBy: jest.Mock;
    find: jest.Mock;
    countBy: jest.Mock;
    remove: jest.Mock;
  };
  let studentsService: { findOne: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn((data: Partial<User>) => ({ ...data })),
      save: jest.fn((user: Partial<User>) =>
        Promise.resolve({
          id: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...user,
        }),
      ),
      existsBy: jest.fn().mockResolvedValue(false),
      findOneBy: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      countBy: jest.fn().mockResolvedValue(1),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    studentsService = { findOne: jest.fn().mockResolvedValue({}) };

    service = new UsersService(
      repository as unknown as Repository<User>,
      studentsService as unknown as StudentsService,
    );
  });

  describe('create', () => {
    it('guarda la contraseña cifrada y no la devuelve', async () => {
      const user = await service.create({
        email: 'Docente@Colegio.edu.co ',
        password: 'Docente123',
        role: Role.TEACHER,
      });

      const saved = repository.save.mock.calls[0][0] as User;
      expect(saved.passwordHash).not.toBe('Docente123');
      expect(await compare('Docente123', saved.passwordHash)).toBe(true);
      expect(user).not.toHaveProperty('passwordHash');
      expect(user.email).toBe('docente@colegio.edu.co');
    });

    it('lanza 409 si el correo ya está registrado', async () => {
      repository.existsBy.mockResolvedValue(true);

      await expect(
        service.create({
          email: 'docente@colegio.edu.co',
          password: 'Docente123',
          role: Role.TEACHER,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('exige studentId para el rol STUDENT', async () => {
      await expect(
        service.create({
          email: 'laura@colegio.edu.co',
          password: 'Laura12345',
          role: Role.STUDENT,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza studentId para roles que no son STUDENT', async () => {
      await expect(
        service.create({
          email: 'docente@colegio.edu.co',
          password: 'Docente123',
          role: Role.TEACHER,
          studentId: STUDENT_ID,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza 404 si el estudiante enlazado no existe', async () => {
      studentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create({
          email: 'laura@colegio.edu.co',
          password: 'Laura12345',
          role: Role.STUDENT,
          studentId: STUDENT_ID,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza 409 si el estudiante ya tiene un usuario', async () => {
      repository.findOneBy.mockImplementation((where: Partial<User>) =>
        Promise.resolve(
          where.studentId === STUDENT_ID ? { id: 'other-user' } : null,
        ),
      );

      await expect(
        service.create({
          email: 'laura@colegio.edu.co',
          password: 'Laura12345',
          role: Role.STUDENT,
          studentId: STUDENT_ID,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('enlaza el usuario STUDENT con su estudiante', async () => {
      const user = await service.create({
        email: 'laura@colegio.edu.co',
        password: 'Laura12345',
        role: Role.STUDENT,
        studentId: STUDENT_ID,
      });

      expect(user).toMatchObject({ role: Role.STUDENT, studentId: STUDENT_ID });
    });
  });

  describe('findOne', () => {
    it('lanza 404 si el usuario no existe', async () => {
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByEmailWithPassword', () => {
    it('busca el correo sin importar mayúsculas ni espacios', async () => {
      await service.findByEmailWithPassword('  Admin@Colegio.edu.co');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: 'admin@colegio.edu.co',
      });
    });
  });

  describe('update y remove', () => {
    function storedUser(overrides: Partial<User> = {}): User {
      return {
        id: 'user-1',
        email: 'docente@colegio.edu.co',
        passwordHash: 'hash',
        role: Role.TEACHER,
        studentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it('cambia el rol de un docente a administrador', async () => {
      repository.findOneBy.mockResolvedValue(storedUser());

      const user = await service.update('user-1', { role: Role.ADMIN });

      expect(user.role).toBe(Role.ADMIN);
    });

    it('guarda cifrada la nueva contraseña', async () => {
      repository.findOneBy.mockResolvedValue(storedUser());

      await service.update('user-1', { password: 'NuevaClave123' });

      const saved = repository.save.mock.calls[0][0] as User;
      expect(await compare('NuevaClave123', saved.passwordHash)).toBe(true);
    });

    it('al dejar de ser STUDENT pierde el enlace con el estudiante', async () => {
      repository.findOneBy.mockResolvedValueOnce(
        storedUser({ role: Role.STUDENT, studentId: STUDENT_ID }),
      );

      const user = await service.update('user-1', { role: Role.TEACHER });

      expect(user.studentId).toBeNull();
    });

    it('no deja quitarle el rol al único administrador', async () => {
      repository.findOneBy.mockResolvedValue(storedUser({ role: Role.ADMIN }));
      repository.countBy.mockResolvedValue(1);

      await expect(
        service.update('user-1', { role: Role.TEACHER }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('no deja borrar al único administrador', async () => {
      repository.findOneBy.mockResolvedValue(storedUser({ role: Role.ADMIN }));
      repository.countBy.mockResolvedValue(1);

      await expect(
        service.remove('user-1', 'otro-admin'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('no deja que un usuario se borre a sí mismo', async () => {
      await expect(service.remove('user-1', 'user-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('borra un docente', async () => {
      repository.findOneBy.mockResolvedValue(storedUser());

      await service.remove('user-1', 'admin-1');

      expect(repository.remove).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    let stored: User;

    beforeEach(async () => {
      stored = {
        id: 'user-1',
        email: 'docente@colegio.edu.co',
        passwordHash: await hash('ClaveActual1', 4),
        role: Role.TEACHER,
        studentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.findOneBy.mockResolvedValue(stored);
    });

    it('guarda la nueva contraseña cifrada', async () => {
      await service.changePassword('user-1', 'ClaveActual1', 'ClaveNueva2');

      const saved = repository.save.mock.calls[0][0] as User;
      expect(await compare('ClaveNueva2', saved.passwordHash)).toBe(true);
    });

    it('rechaza una contraseña actual incorrecta', async () => {
      await expect(
        service.changePassword('user-1', 'Equivocada1', 'ClaveNueva2'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rechaza repetir la misma contraseña', async () => {
      await expect(
        service.changePassword('user-1', 'ClaveActual1', 'ClaveActual1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
