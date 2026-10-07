import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './models/student.model';

@Injectable()
export class StudentsService {
  private readonly students = new Map<string, Student>();

  create(dto: CreateStudentDto): Student {
    const student: Student = {
      id: randomUUID(),
      ...dto,
      createdAt: new Date(),
    };
    this.students.set(student.id, student);
    return student;
  }

  findAll(): Student[] {
    return [...this.students.values()];
  }

  findOne(id: string): Student {
    const student = this.students.get(id);
    if (!student) {
      throw new NotFoundException(`Student with id "${id}" not found`);
    }
    return student;
  }

  update(id: string, dto: UpdateStudentDto): Student {
    return Object.assign(this.findOne(id), dto);
  }

  remove(id: string): void {
    this.findOne(id);
    this.students.delete(id);
  }
}
