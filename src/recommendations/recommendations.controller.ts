import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { assertCanAccessStudent } from '../auth/student-access';
import { Role } from '../users/role.enum';
import { AreaAnalysis } from './models/area-analysis.model';
import { GradeLevelReport } from './models/grade-level-report.model';
import { StudentAnalysis } from './models/student-analysis.model';
import { RecommendationsService } from './recommendations.service';

@ApiTags('Recomendaciones')
@ApiBearerAuth()
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  /** Análisis general del estudiante: promedio, nivel, materias más fuerte y más débil, y consejos. */
  @Get('students/:studentId')
  analyzeStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentAnalysis> {
    assertCanAccessStudent(user, studentId);
    return this.recommendationsService.analyzeStudent(studentId);
  }

  /** Análisis del estudiante en una sola materia. */
  @Get('students/:studentId/areas/:areaId')
  analyzeStudentArea(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('areaId', ParseUUIDPipe) areaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AreaAnalysis> {
    assertCanAccessStudent(user, studentId);
    return this.recommendationsService.analyzeStudentArea(studentId, areaId);
  }

  /** Reporte de un grado: promedios por materia, niveles y estudiantes en riesgo. */
  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('grade-levels/:gradeLevel')
  gradeLevelReport(
    @Param('gradeLevel') gradeLevel: string,
  ): Promise<GradeLevelReport> {
    return this.recommendationsService.gradeLevelReport(gradeLevel);
  }
}
