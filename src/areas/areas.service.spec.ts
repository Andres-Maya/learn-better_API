import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AreasService } from './areas.service';
import { Area } from './entities/area.entity';

describe('AreasService', () => {
  let service: AreasService;
  let existing: Area | null;
  let queryBuilder: { where: jest.Mock; getOne: jest.Mock };
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(() => {
    existing = null;
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(() => Promise.resolve(existing)),
    };
    repository = {
      create: jest.fn((data: Partial<Area>) => ({ ...data })),
      save: jest.fn((area: Partial<Area>) =>
        Promise.resolve({ id: 'area-1', ...area }),
      ),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    service = new AreasService(repository as unknown as Repository<Area>);
  });

  it('compara el nombre sin importar mayúsculas ni espacios', async () => {
    await service.create({ name: '  Matemáticas ' });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'LOWER(TRIM(area.name)) = :name',
      { name: 'matemáticas' },
    );
  });

  it('lanza 409 si ya existe una materia con ese nombre', async () => {
    existing = { id: 'area-2', name: 'Matemáticas' } as Area;

    await expect(
      service.create({ name: 'matemáticas' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
