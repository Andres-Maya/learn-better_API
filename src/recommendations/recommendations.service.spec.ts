import { NotFoundException } from '@nestjs/common';
import { AreasService } from '../areas/areas.service';
import { Area } from '../areas/entities/area.entity';
import { Grade } from '../grades/entities/grade.entity';
import { GradesService } from '../grades/grades.service';
import { Student } from '../students/entities/student.entity';
import { StudentsService } from '../students/students.service';
import { PerformanceLevel } from './models/performance-level.enum';
import { Trend } from './models/trend.enum';
import { RecommendationsService } from './recommendations.service';

const STUDENT_ID = 'student-1';
const MATH: Area = makeArea('area-math', 'Matemáticas');
const ENGLISH: Area = makeArea('area-english', 'Inglés');

function makeArea(id: string, name: string): Area {
  return {
    id,
    name,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

let gradeCounter = 0;
function makeGrade(area: Area, score: number, period: number): Grade {
  gradeCounter += 1;
  return {
    id: `grade-${gradeCounter}`,
    studentId: STUDENT_ID,
    areaId: area.id,
    score,
    period,
    description: null,
    createdAt: new Date(2026, 0, gradeCounter),
    updatedAt: new Date(2026, 0, gradeCounter),
  };
}

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let grades: Grade[];
  let areas: Area[];

  beforeEach(() => {
    grades = [];
    areas = [MATH, ENGLISH];

    const student: Student = {
      id: STUDENT_ID,
      firstName: 'Laura',
      lastName: 'Gómez',
      email: null,
      gradeLevel: '9A',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const studentsService = {
      findOne: jest.fn().mockResolvedValue(student),
    } as unknown as StudentsService;
    const areasService = {
      findAll: jest.fn(() => Promise.resolve(areas)),
      findOne: jest.fn((id: string) => {
        const area = areas.find((candidate) => candidate.id === id);
        return area
          ? Promise.resolve(area)
          : Promise.reject(new NotFoundException());
      }),
    } as unknown as AreasService;
    const gradesService = {
      findAll: jest.fn((filter: { studentId?: string; areaId?: string } = {}) =>
        Promise.resolve(
          grades.filter(
            (grade) =>
              (filter.studentId === undefined ||
                grade.studentId === filter.studentId) &&
              (filter.areaId === undefined || grade.areaId === filter.areaId),
          ),
        ),
      ),
    } as unknown as GradesService;

    service = new RecommendationsService(
      studentsService,
      areasService,
      gradesService,
    );
  });

  describe('nivel de desempeño en los bordes de la escala', () => {
    it.each([
      [2.99, PerformanceLevel.LOW],
      [3, PerformanceLevel.BASIC],
      [3.99, PerformanceLevel.BASIC],
      [4, PerformanceLevel.HIGH],
      [4.59, PerformanceLevel.HIGH],
      [4.6, PerformanceLevel.SUPERIOR],
      [5, PerformanceLevel.SUPERIOR],
    ])('un promedio de %s es %s', async (score, level) => {
      grades.push(makeGrade(MATH, score, 1));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.level).toBe(level);
    });
  });

  describe('tendencia', () => {
    it('es SIN_DATOS_SUFICIENTES con una sola nota', async () => {
      grades.push(makeGrade(MATH, 3, 1));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.trend).toBe(Trend.INSUFFICIENT_DATA);
    });

    it('es MEJORANDO cuando la mitad reciente sube 0.3 o más', async () => {
      grades.push(makeGrade(MATH, 3, 1), makeGrade(MATH, 3.3, 2));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.trend).toBe(Trend.IMPROVING);
    });

    it('es BAJANDO cuando la mitad reciente baja 0.3 o más', async () => {
      grades.push(makeGrade(MATH, 4, 1), makeGrade(MATH, 3.5, 2));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.trend).toBe(Trend.DECLINING);
    });

    it('es ESTABLE cuando la diferencia es menor a 0.3', async () => {
      grades.push(makeGrade(MATH, 4, 1), makeGrade(MATH, 4.2, 2));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.trend).toBe(Trend.STABLE);
    });

    it('ordena por periodo y no por fecha de registro', async () => {
      // Registered in reverse order: period 2 first, period 1 later.
      grades.push(makeGrade(MATH, 4.5, 2), makeGrade(MATH, 3, 1));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.trend).toBe(Trend.IMPROVING);
    });

    it('ignora la nota del medio cuando la cantidad es impar', async () => {
      grades.push(
        makeGrade(MATH, 3, 1),
        makeGrade(MATH, 1, 2),
        makeGrade(MATH, 3.1, 3),
      );

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.trend).toBe(Trend.STABLE);
    });
  });

  describe('irregularidad', () => {
    const irregular = /resultados en Matemáticas son irregulares/;

    it('recomienda un horario fijo si la diferencia es de 1.5 o más', async () => {
      grades.push(makeGrade(MATH, 2.5, 1), makeGrade(MATH, 4, 1));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.recommendations.some((r) => irregular.test(r))).toBe(
        true,
      );
    });

    it('no lo recomienda si la diferencia es menor a 1.5', async () => {
      grades.push(makeGrade(MATH, 2.6, 1), makeGrade(MATH, 4, 1));

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis.recommendations.some((r) => irregular.test(r))).toBe(
        false,
      );
    });
  });

  describe('analyzeStudent', () => {
    it('avisa que no hay notas cuando el estudiante no tiene ninguna', async () => {
      const analysis = await service.analyzeStudent(STUDENT_ID);

      expect(analysis).toMatchObject({
        studentName: 'Laura Gómez',
        overallAverage: null,
        level: null,
        strongestArea: null,
        weakestArea: null,
        areas: [],
      });
      expect(analysis.generalRecommendations).toHaveLength(1);
    });

    it('calcula promedio, nivel y materias más fuerte y más débil', async () => {
      grades.push(
        makeGrade(MATH, 2, 1),
        makeGrade(MATH, 3, 2),
        makeGrade(ENGLISH, 4.5, 1),
        makeGrade(ENGLISH, 4.7, 2),
      );

      const analysis = await service.analyzeStudent(STUDENT_ID);

      expect(analysis.overallAverage).toBe(3.55);
      expect(analysis.level).toBe(PerformanceLevel.BASIC);
      expect(analysis.weakestArea).toBe('Matemáticas');
      expect(analysis.strongestArea).toBe('Inglés');
      expect(analysis.areas.map((area) => area.areaName)).toEqual([
        'Matemáticas',
        'Inglés',
      ]);
    });

    it('prioriza las materias que el estudiante está perdiendo', async () => {
      grades.push(makeGrade(MATH, 2, 1), makeGrade(ENGLISH, 4, 1));

      const analysis = await service.analyzeStudent(STUDENT_ID);

      expect(analysis.generalRecommendations[0]).toMatch(
        /Prioriza las áreas que estás perdiendo \(Matemáticas\)/,
      );
    });

    it('solo incluye las materias en las que hay notas', async () => {
      grades.push(makeGrade(ENGLISH, 4, 1));

      const analysis = await service.analyzeStudent(STUDENT_ID);

      expect(analysis.areas).toHaveLength(1);
      expect(analysis.areas[0].areaName).toBe('Inglés');
    });
  });

  describe('analyzeStudentArea', () => {
    it('lanza 404 si el estudiante no tiene notas en la materia', async () => {
      grades.push(makeGrade(ENGLISH, 4, 1));

      await expect(
        service.analyzeStudentArea(STUDENT_ID, MATH.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('calcula promedio, nota más alta, más baja y cantidad', async () => {
      grades.push(
        makeGrade(MATH, 3, 1),
        makeGrade(MATH, 4, 2),
        makeGrade(MATH, 3.5, 3),
      );

      const analysis = await service.analyzeStudentArea(STUDENT_ID, MATH.id);

      expect(analysis).toMatchObject({
        areaName: 'Matemáticas',
        average: 3.5,
        highestScore: 4,
        lowestScore: 3,
        gradesCount: 3,
      });
    });
  });
});
