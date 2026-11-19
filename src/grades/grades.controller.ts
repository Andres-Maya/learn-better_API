import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { assertCanAccessStudent, ownStudentId } from '../auth/student-access';
import { Role } from '../users/role.enum';
import { CreateGradeDto } from './dto/create-grade.dto';
import { FilterGradesDto } from './dto/filter-grades.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradesService } from './grades.service';
import { Grade } from './entities/grade.entity';

@ApiTags('Notas')
@ApiBearerAuth()
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  /** Registra una nota de 0 a 5 en un periodo de 1 a 4. */
  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  create(@Body() dto: CreateGradeDto): Promise<Grade> {
    return this.gradesService.create(dto);
  }

  /** Lista notas con filtros opcionales. Un estudiante solo recibe las suyas. */
  @Get()
  findAll(
    @Query() filter: FilterGradesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Grade[]> {
    const studentId = ownStudentId(user);
    if (studentId !== undefined) {
      if (filter.studentId !== undefined) {
        assertCanAccessStudent(user, filter.studentId);
      }
      return this.gradesService.findAll({ ...filter, studentId });
    }
    return this.gradesService.findAll(filter);
  }

  /** Muestra una nota. */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Grade> {
    const grade = await this.gradesService.findOne(id);
    assertCanAccessStudent(user, grade.studentId);
    return grade;
  }

  /** Edita el puntaje, periodo o descripción de una nota. */
  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ): Promise<Grade> {
    return this.gradesService.update(id, dto);
  }

  /** Borra una nota. */
  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.gradesService.remove(id);
  }
}
