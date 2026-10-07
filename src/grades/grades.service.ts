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

  create(dto: CreateGradeDto): Grade {
    this.studentsService.findOne(dto.studentId);
    this.areasService.findOne(dto.areaId);

    const grade: Grade = {
      id: randomUUID(),
      ...dto,
      createdAt: new Date(),
    };
    this.grades.set(grade.id, grade);
    return grade;
  }

  findAll(filter: FilterGradesDto = {}): Grade[] {
    return [...this.grades.values()].filter(
      (grade) =>
        (filter.studentId === undefined ||
          grade.studentId === filter.studentId) &&
        (filter.areaId === undefined || grade.areaId === filter.areaId) &&
        (filter.period === undefined || grade.period === filter.period),
    );
  }

  findOne(id: string): Grade {
    const grade = this.grades.get(id);
    if (!grade) {
      throw new NotFoundException(`Grade with id "${id}" not found`);
    }
    return grade;
  }

  update(id: string, dto: UpdateGradeDto): Grade {
    return Object.assign(this.findOne(id), dto);
  }

  remove(id: string): void {
    this.findOne(id);
    this.grades.delete(id);
  }
}
