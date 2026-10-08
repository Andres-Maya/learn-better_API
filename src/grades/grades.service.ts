import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AreasService } from '../areas/areas.service';
import { StudentsService } from '../students/students.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { FilterGradesDto } from './dto/filter-grades.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Grade } from './models/grade.model';

@Injectable()
export class GradesService {
  private readonly grades = new Map<string, Grade>();

  constructor(
    private readonly studentsService: StudentsService,
    private readonly areasService: AreasService,
  ) {}

  async create(dto: CreateGradeDto): Promise<Grade> {
    await this.studentsService.findOne(dto.studentId);
    await this.areasService.findOne(dto.areaId);

    const grade: Grade = {
      id: randomUUID(),
      ...dto,
      createdAt: new Date(),
    };
    this.grades.set(grade.id, grade);
    return grade;
  }

  async findAll(filter: FilterGradesDto = {}): Promise<Grade[]> {
    return [...this.grades.values()].filter(
      (grade) =>
        (filter.studentId === undefined ||
          grade.studentId === filter.studentId) &&
        (filter.areaId === undefined || grade.areaId === filter.areaId) &&
        (filter.period === undefined || grade.period === filter.period),
    );
  }

  async findOne(id: string): Promise<Grade> {
    const grade = this.grades.get(id);
    if (!grade) {
      throw new NotFoundException(`Grade with id "${id}" not found`);
    }
    return grade;
  }

  async update(id: string, dto: UpdateGradeDto): Promise<Grade> {
    return Object.assign(await this.findOne(id), dto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    this.grades.delete(id);
  }
}
