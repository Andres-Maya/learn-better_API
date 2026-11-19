import { ConflictException, NotFoundException } from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    findAndCount: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn((data: Partial<Student>) => ({ ...data })),
      save: jest.fn((student: Partial<Student>) =>
        Promise.resolve({ id: 'student-1', ...student }),
      ),
      findOneBy: jest.fn().mockResolvedValue(null),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    service = new StudentsService(repository as unknown as Repository<Student>);
  });

  it('crea un estudiante', async () => {
    const student = await service.create({
      firstName: 'Laura',
      lastName: 'Gómez',
      gradeLevel: '9A',
    });

    expect(student).toMatchObject({ id: 'student-1', firstName: 'Laura' });
  });

  it('lanza 409 si otro estudiante ya usa el correo', async () => {
    repository.findOneBy.mockResolvedValue({ id: 'student-2' });

    await expect(
      service.create({
        firstName: 'Laura',
        lastName: 'Gómez',
        gradeLevel: '9A',
        email: 'laura@colegio.edu.co',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite editar un estudiante conservando su propio correo', async () => {
    const existing = {
      id: 'student-1',
      firstName: 'Laura',
      email: 'laura@colegio.edu.co',
    };
    repository.findOneBy.mockResolvedValue(existing);

    await expect(
      service.update('student-1', { email: 'laura@colegio.edu.co' }),
    ).resolves.toMatchObject({ id: 'student-1' });
  });

  it('lanza 404 si el estudiante no existe', async () => {
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('findPage', () => {
    it('busca en nombre, apellido o correo dentro del grado', async () => {
      await service.findPage({
        page: 2,
        limit: 10,
        search: 'gómez',
        gradeLevel: '9A',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { gradeLevel: '9A', firstName: ILike('%gómez%') },
            { gradeLevel: '9A', lastName: ILike('%gómez%') },
            { gradeLevel: '9A', email: ILike('%gómez%') },
          ],
          skip: 10,
          take: 10,
        }),
      );
    });

    it('devuelve la página con el total', async () => {
      repository.findAndCount.mockResolvedValue([[{ id: 'student-1' }], 41]);

      const page = await service.findPage({ page: 1, limit: 20 });

      expect(page).toMatchObject({ total: 41, totalPages: 3, page: 1 });
      expect(page.data).toHaveLength(1);
    });
  });
});
