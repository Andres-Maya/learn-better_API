import { Module } from '@nestjs/common';
import { AreasModule } from '../areas/areas.module';
import { StudentsModule } from '../students/students.module';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [StudentsModule, AreasModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
