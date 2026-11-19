import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { compare } from 'bcryptjs';
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
      repository.existsBy.mockImplementation((where: Partial<User>) =>
        Promise.resolve(where.studentId === STUDENT_ID),
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
});
