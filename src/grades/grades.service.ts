import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AreasService } from '../areas/areas.service';
import { Page, pageOptions, toPage } from '../common/dto/paginated.dto';
import { StudentsService } from '../students/students.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { FilterGradesDto } from './dto/filter-grades.dto';
import { GradesQueryDto } from './dto/grades-query.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Grade } from './entities/grade.entity';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradesRepository: Repository<Grade>,
    private readonly studentsService: StudentsService,
    private readonly areasService: AreasService,
  ) {}

  async create(dto: CreateGradeDto): Promise<Grade> {
    await this.studentsService.findOne(dto.studentId);
    await this.areasService.findOne(dto.areaId);

    return this.gradesRepository.save(this.gradesRepository.create(dto));
  }

  // Every matching grade, used by the recommendations. The API uses findPage().
  findAll(filter: FilterGradesDto = {}): Promise<Grade[]> {
    return this.gradesRepository.find({
      where: whereFor(filter),
      order: { createdAt: 'ASC' },
    });
  }

  async findPage(query: GradesQueryDto): Promise<Page<Grade>> {
    return toPage(
      await this.gradesRepository.findAndCount({
        where: whereFor(query),
        order: { period: 'ASC', createdAt: 'ASC' },
        ...pageOptions(query),
      }),
      query,
    );
  }

  async findOne(id: string): Promise<Grade> {
    const grade = await this.gradesRepository.findOneBy({ id });
    if (!grade) {
      throw new NotFoundException(`Grade with id "${id}" not found`);
    }
    return grade;
  }

  async update(id: string, dto: UpdateGradeDto): Promise<Grade> {
    const grade = await this.findOne(id);
    return this.gradesRepository.save(Object.assign(grade, dto));
  }

  async remove(id: string): Promise<void> {
    const grade = await this.findOne(id);
    await this.gradesRepository.remove(grade);
  }
}

function whereFor(filter: FilterGradesDto): FindOptionsWhere<Grade> {
  const where: FindOptionsWhere<Grade> = {};
  if (filter.studentId !== undefined) where.studentId = filter.studentId;
  if (filter.areaId !== undefined) where.areaId = filter.areaId;
  if (filter.period !== undefined) where.period = filter.period;
  return where;
}
