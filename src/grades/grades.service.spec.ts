import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AreasService } from '../areas/areas.service';
import { StudentsService } from '../students/students.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { Grade } from './entities/grade.entity';
import { GradesService } from './grades.service';

const STUDENT_ID = '3f6c1d2a-8b4e-4c1a-9f2d-1a2b3c4d5e6f';
const AREA_ID = '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d';

describe('GradesService', () => {
  let service: GradesService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
  };
  let studentsService: { findOne: jest.Mock };
  let areasService: { findOne: jest.Mock };

  const dto: CreateGradeDto = {
    studentId: STUDENT_ID,
    areaId: AREA_ID,
    score: 4.2,
    period: 2,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn((data: Partial<Grade>) => ({ ...data })),
      save: jest.fn((grade: Partial<Grade>) =>
        Promise.resolve({ id: 'grade-1', ...grade }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    studentsService = { findOne: jest.fn().mockResolvedValue({}) };
    areasService = { findOne: jest.fn().mockResolvedValue({}) };

    service = new GradesService(
      repository as unknown as Repository<Grade>,
      studentsService as unknown as StudentsService,
      areasService as unknown as AreasService,
    );
  });

  describe('create', () => {
    it('guarda la nota cuando el estudiante y la materia existen', async () => {
      const grade = await service.create(dto);

      expect(studentsService.findOne).toHaveBeenCalledWith(STUDENT_ID);
      expect(areasService.findOne).toHaveBeenCalledWith(AREA_ID);
      expect(repository.save).toHaveBeenCalledWith(dto);
      expect(grade).toMatchObject({ id: 'grade-1', score: 4.2, period: 2 });
    });

    it('lanza 404 y no guarda si el estudiante no existe', async () => {
      studentsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('lanza 404 y no guarda si la materia no existe', async () => {
      areasService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('sin filtros consulta todas las notas', async () => {
      await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'ASC' },
      });
    });

    it('aplica solo los filtros que llegan', async () => {
      await service.findAll({ studentId: STUDENT_ID, period: 3 });

      expect(repository.find).toHaveBeenCalledWith({
        where: { studentId: STUDENT_ID, period: 3 },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('lanza 404 si la nota no existe', async () => {
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('cambia solo los campos enviados', async () => {
      repository.findOneBy.mockResolvedValue({
        id: 'grade-1',
        ...dto,
        description: null,
      });

      const grade = await service.update('grade-1', { score: 3.1 });

      expect(grade).toMatchObject({ score: 3.1, period: 2 });
    });

    it('lanza 404 si la nota no existe', async () => {
      await expect(
        service.update('missing', { score: 3 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('lanza 404 si la nota no existe', async () => {
      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
