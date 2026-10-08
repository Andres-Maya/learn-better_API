import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasModule } from '../areas/areas.module';
import { StudentsModule } from '../students/students.module';
import { Grade } from './entities/grade.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grade]), StudentsModule, AreasModule],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
