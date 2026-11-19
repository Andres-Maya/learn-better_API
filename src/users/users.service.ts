import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/is-unique-violation';
import { StudentsService } from '../students/students.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Role } from './role.enum';

const BCRYPT_ROUNDS = 10;

export type PublicUser = Omit<User, 'passwordHash' | 'student'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly studentsService: StudentsService,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const email = normalizeEmail(dto.email);
    await this.assertStudentLink(dto.role, dto.studentId);
    await this.assertEmailIsAvailable(email);

    const user = this.usersRepository.create({
      email,
      passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
      role: dto.role,
      studentId: dto.studentId ?? null,
    });
    return toPublicUser(await this.save(user));
  }

  async findOne(id: string): Promise<PublicUser> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return toPublicUser(user);
  }

  // Returns the password hash too, so it is only meant for the login flow.
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email: normalizeEmail(email) });
  }

  async existsWithRole(role: Role): Promise<boolean> {
    return this.usersRepository.existsBy({ role });
  }

  private async assertStudentLink(
    role: Role,
    studentId: string | undefined,
  ): Promise<void> {
    if (role !== Role.STUDENT) {
      if (studentId !== undefined) {
        throw new BadRequestException(
          'Solo los usuarios con rol STUDENT se pueden enlazar a un estudiante',
        );
      }
      return;
    }

    if (studentId === undefined) {
      throw new BadRequestException(
        'Un usuario con rol STUDENT necesita el studentId del estudiante',
      );
    }
    await this.studentsService.findOne(studentId);
    if (await this.usersRepository.existsBy({ studentId })) {
      throw new ConflictException(
        `El estudiante "${studentId}" ya tiene un usuario`,
      );
    }
  }

  private async assertEmailIsAvailable(email: string): Promise<void> {
    if (await this.usersRepository.existsBy({ email })) {
      throw this.emailTaken(email);
    }
  }

  // The unique constraints still catch two requests racing past the checks above.
  private async save(user: User): Promise<User> {
    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw this.emailTaken(user.email);
      }
      throw error;
    }
  }

  private emailTaken(email: string): ConflictException {
    return new ConflictException(
      `Ya existe un usuario con el correo "${email}"`,
    );
  }
}

export function toPublicUser(user: User): PublicUser {
  const {
    passwordHash: _passwordHash,
    student: _student,
    ...publicUser
  } = user;
  return publicUser;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
