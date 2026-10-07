import { Module } from '@nestjs/common';
import { AreasModule } from '../areas/areas.module';
import { GradesModule } from '../grades/grades.module';
import { StudentsModule } from '../students/students.module';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [StudentsModule, AreasModule, GradesModule],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
