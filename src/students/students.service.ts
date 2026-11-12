import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/is-unique-violation';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from './entities/student.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
  ) {}

  async create(dto: CreateStudentDto): Promise<Student> {
    if (dto.email !== undefined) {
      await this.assertEmailIsAvailable(dto.email);
    }
    return this.save(this.studentsRepository.create(dto));
  }

  findAll(): Promise<Student[]> {
    return this.studentsRepository.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOneBy({ id });
    if (!student) {
      throw new NotFoundException(`Student with id "${id}" not found`);
    }
    return student;
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    if (dto.email !== undefined) {
      await this.assertEmailIsAvailable(dto.email, id);
    }
    return this.save(Object.assign(student, dto));
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentsRepository.remove(student);
  }

  private async assertEmailIsAvailable(
    email: string,
    ignoreId?: string,
  ): Promise<void> {
    const existing = await this.studentsRepository.findOneBy({ email });
    if (existing && existing.id !== ignoreId) {
      throw this.emailTaken(email);
    }
  }

  // The unique constraint still catches two requests racing past the check above.
  private async save(student: Student): Promise<Student> {
    try {
      return await this.studentsRepository.save(student);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw this.emailTaken(student.email ?? '');
      }
      throw error;
    }
  }

  private emailTaken(email: string): ConflictException {
    return new ConflictException(
      `Ya existe un estudiante con el correo "${email}"`,
    );
  }
}
