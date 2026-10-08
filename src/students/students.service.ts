import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './models/student.model';

@Injectable()
export class StudentsService {
  private readonly students = new Map<string, Student>();

  async create(dto: CreateStudentDto): Promise<Student> {
    const student: Student = {
      id: randomUUID(),
      ...dto,
      createdAt: new Date(),
    };
    this.students.set(student.id, student);
    return student;
  }

  async findAll(): Promise<Student[]> {
    return [...this.students.values()];
  }

  async findOne(id: string): Promise<Student> {
    const student = this.students.get(id);
    if (!student) {
      throw new NotFoundException(`Student with id "${id}" not found`);
    }
    return student;
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    return Object.assign(await this.findOne(id), dto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    this.students.delete(id);
  }
}
