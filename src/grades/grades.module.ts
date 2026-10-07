import { Module } from '@nestjs/common';
import { AreasModule } from '../areas/areas.module';
import { StudentsModule } from '../students/students.module';
import { GradesService } from './grades.service';

@Module({
  imports: [StudentsModule, AreasModule],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
