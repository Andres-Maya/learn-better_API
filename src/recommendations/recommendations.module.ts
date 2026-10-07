import { Module } from '@nestjs/common';
import { AreasModule } from '../areas/areas.module';
import { GradesModule } from '../grades/grades.module';
import { StudentsModule } from '../students/students.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [StudentsModule, AreasModule, GradesModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
