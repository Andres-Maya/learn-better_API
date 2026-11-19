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

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  create(@Body() dto: CreateGradeDto): Promise<Grade> {
    return this.gradesService.create(dto);
  }

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

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Grade> {
    const grade = await this.gradesService.findOne(id);
    assertCanAccessStudent(user, grade.studentId);
    return grade;
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ): Promise<Grade> {
    return this.gradesService.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.gradesService.remove(id);
  }
}
