import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { assertCanAccessStudent } from '../auth/student-access';
import { AreaAnalysis } from './models/area-analysis.model';
import { StudentAnalysis } from './models/student-analysis.model';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('students/:studentId')
  analyzeStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StudentAnalysis> {
    assertCanAccessStudent(user, studentId);
    return this.recommendationsService.analyzeStudent(studentId);
  }

  @Get('students/:studentId/areas/:areaId')
  analyzeStudentArea(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('areaId', ParseUUIDPipe) areaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AreaAnalysis> {
    assertCanAccessStudent(user, studentId);
    return this.recommendationsService.analyzeStudentArea(studentId, areaId);
  }
}
