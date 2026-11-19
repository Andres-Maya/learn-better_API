import { NotFoundException } from '@nestjs/common';
import { AreasService } from '../areas/areas.service';
import { GradesService } from '../grades/grades.service';
import { StudentsService } from '../students/students.service';
import { AreaAnalysis } from './models/area-analysis.model';
import { PerformanceLevel } from './models/performance-level.enum';
import { StudentAnalysis } from './models/student-analysis.model';
import { Trend } from './models/trend.enum';
import { RecommendationsService } from './recommendations.service';

function area(areaId: string, average: number): AreaAnalysis {
  return {
    areaId,
    areaName: areaId === 'math' ? 'Matemáticas' : 'Inglés',
    average,
    highestScore: average,
    lowestScore: average,
    gradesCount: 1,
    level: PerformanceLevel.BASIC,
    trend: Trend.INSUFFICIENT_DATA,
    recommendations: [],
  };
}

function analysis(
  studentId: string,
  overallAverage: number | null,
  level: PerformanceLevel | null,
  areas: AreaAnalysis[] = [],
): StudentAnalysis {
  return {
    studentId,
    studentName: `Estudiante ${studentId}`,
    overallAverage,
    level,
    strongestArea: areas.at(-1)?.areaName ?? null,
    weakestArea: areas[0]?.areaName ?? null,
    areas,
    generalRecommendations: [],
  };
}

describe('RecommendationsService.gradeLevelReport', () => {
  let service: RecommendationsService;
  let studentsService: { findByGradeLevel: jest.Mock };

  beforeEach(() => {
    studentsService = { findByGradeLevel: jest.fn() };
    service = new RecommendationsService(
      studentsService as unknown as StudentsService,
      {} as AreasService,
      {} as GradesService,
    );
  });

  it('lanza 404 si el grado no tiene estudiantes', async () => {
    studentsService.findByGradeLevel.mockResolvedValue([]);

    await expect(service.gradeLevelReport('7Z')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('resume niveles, materias y estudiantes en riesgo', async () => {
    studentsService.findByGradeLevel.mockResolvedValue([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
    ]);
    const analyses: Record<string, StudentAnalysis> = {
      a: analysis('a', 2.5, PerformanceLevel.LOW, [
        area('math', 2),
        area('english', 3),
      ]),
      b: analysis('b', 2.9, PerformanceLevel.LOW, [area('math', 2.9)]),
      c: analysis('c', 4.7, PerformanceLevel.SUPERIOR, [area('english', 4.7)]),
      d: analysis('d', null, null),
    };
    jest
      .spyOn(service, 'analyzeStudent')
      .mockImplementation((id: string) => Promise.resolve(analyses[id]));

    const report = await service.gradeLevelReport('9A');

    expect(report).toMatchObject({
      gradeLevel: '9A',
      studentsCount: 4,
      studentsWithGrades: 3,
      overallAverage: 3.37,
      levels: { BAJO: 2, BASICO: 0, ALTO: 0, SUPERIOR: 1 },
    });
    expect(report.areas).toEqual([
      {
        areaId: 'math',
        areaName: 'Matemáticas',
        average: 2.45,
        studentsCount: 2,
      },
      {
        areaId: 'english',
        areaName: 'Inglés',
        average: 3.85,
        studentsCount: 2,
      },
    ]);
    expect(report.studentsAtRisk.map((student) => student.studentId)).toEqual([
      'a',
      'b',
    ]);
  });

  it('sin notas en el grado el promedio es null', async () => {
    studentsService.findByGradeLevel.mockResolvedValue([{ id: 'd' }]);
    jest
      .spyOn(service, 'analyzeStudent')
      .mockResolvedValue(analysis('d', null, null));

    const report = await service.gradeLevelReport('9A');

    expect(report.overallAverage).toBeNull();
    expect(report.studentsAtRisk).toEqual([]);
  });
});
