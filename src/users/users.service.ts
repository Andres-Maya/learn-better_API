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
import { PublicUserDto } from './dto/public-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from './role.enum';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly studentsService: StudentsService,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUserDto> {
    const email = normalizeEmail(dto.email);
    const studentId = dto.studentId ?? null;
    await this.assertStudentLink(dto.role, studentId);
    await this.assertEmailIsAvailable(email);

    const user = this.usersRepository.create({
      email,
      passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
      role: dto.role,
      studentId,
    });
    return toPublicUser(await this.save(user));
  }

  async findAll(): Promise<PublicUserDto[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'ASC' },
    });
    return users.map(toPublicUser);
  }

  async findOne(id: string): Promise<PublicUserDto> {
    return toPublicUser(await this.getUser(id));
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUserDto> {
    const user = await this.getUser(id);
    const role = dto.role ?? user.role;
    // Changing a STUDENT to another role drops the link to the student.
    const studentId =
      dto.studentId !== undefined
        ? dto.studentId
        : role === Role.STUDENT
          ? user.studentId
          : null;

    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
      await this.assertIsNotLastAdmin();
    }
    if (role !== user.role || studentId !== user.studentId) {
      await this.assertStudentLink(role, studentId, user.id);
    }
    if (dto.email !== undefined) {
      const email = normalizeEmail(dto.email);
      if (email !== user.email) {
        await this.assertEmailIsAvailable(email);
      }
      user.email = email;
    }
    if (dto.password !== undefined) {
      user.passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    }
    user.role = role;
    user.studentId = studentId;
    // Drop the loaded relation so TypeORM saves the new studentId column.
    delete user.student;

    return toPublicUser(await this.save(user));
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException('No puedes borrar tu propio usuario');
    }
    const user = await this.getUser(id);
    if (user.role === Role.ADMIN) {
      await this.assertIsNotLastAdmin();
    }
    await this.usersRepository.remove(user);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  // Returns the password hash too, so it is only meant for the login flow.
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email: normalizeEmail(email) });
  }

  async existsWithRole(role: Role): Promise<boolean> {
    return this.usersRepository.existsBy({ role });
  }

  private async getUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  // Without an admin nobody could manage users anymore.
  private async assertIsNotLastAdmin(): Promise<void> {
    if ((await this.usersRepository.countBy({ role: Role.ADMIN })) <= 1) {
      throw new ConflictException(
        'No se puede quitar o borrar al único administrador',
      );
    }
  }

  private async assertStudentLink(
    role: Role,
    studentId: string | null,
    ignoreUserId?: string,
  ): Promise<void> {
    if (role !== Role.STUDENT) {
      if (studentId !== null) {
        throw new BadRequestException(
          'Solo los usuarios con rol STUDENT se pueden enlazar a un estudiante',
        );
      }
      return;
    }

    if (studentId === null) {
      throw new BadRequestException(
        'Un usuario con rol STUDENT necesita el studentId del estudiante',
      );
    }
    await this.studentsService.findOne(studentId);
    const linked = await this.usersRepository.findOneBy({ studentId });
    if (linked && linked.id !== ignoreUserId) {
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

export function toPublicUser(user: User): PublicUserDto {
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
