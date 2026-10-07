import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
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
  ): StudentAnalysis {
    return this.recommendationsService.analyzeStudent(studentId);
  }

  @Get('students/:studentId/areas/:areaId')
  analyzeStudentArea(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('areaId', ParseUUIDPipe) areaId: string,
  ): AreaAnalysis {
    return this.recommendationsService.analyzeStudentArea(studentId, areaId);
  }
}
