import { Injectable, NotFoundException } from '@nestjs/common';
import { AreasService } from '../areas/areas.service';
import { Area } from '../areas/entities/area.entity';
import {
  HIGH_SCORE,
  PASSING_SCORE,
  SUPERIOR_SCORE,
} from '../grades/grade-scale';
import { GradesService } from '../grades/grades.service';
import { Grade } from '../grades/entities/grade.entity';
import { StudentsService } from '../students/students.service';
import { AreaAnalysis } from './models/area-analysis.model';
import { PerformanceLevel } from './models/performance-level.enum';
import { StudentAnalysis } from './models/student-analysis.model';
import { Trend } from './models/trend.enum';

const TREND_THRESHOLD = 0.3;
const INCONSISTENCY_THRESHOLD = 1.5;

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly areasService: AreasService,
    private readonly gradesService: GradesService,
  ) {}

  async analyzeStudent(studentId: string): Promise<StudentAnalysis> {
    const student = await this.studentsService.findOne(studentId);
    const grades = await this.gradesService.findAll({ studentId });

    const gradesByArea = new Map<string, Grade[]>();
    for (const grade of grades) {
      const areaGrades = gradesByArea.get(grade.areaId) ?? [];
      areaGrades.push(grade);
      gradesByArea.set(grade.areaId, areaGrades);
    }

    const areas = (await this.areasService.findAll())
      .filter((area) => gradesByArea.has(area.id))
      .map((area) => this.buildAreaAnalysis(area, gradesByArea.get(area.id)!))
      .sort((a, b) => a.average - b.average);

    const studentName = `${student.firstName} ${student.lastName}`;
    if (areas.length === 0) {
      return {
        studentId,
        studentName,
        overallAverage: null,
        level: null,
        strongestArea: null,
        weakestArea: null,
        areas,
        generalRecommendations: [
          'Aún no hay notas registradas para este alumno. Registra notas para generar recomendaciones.',
        ],
      };
    }

    const overallAverage = round(mean(areas.map((area) => area.average)));

    return {
      studentId,
      studentName,
      overallAverage,
      level: levelFor(overallAverage),
      strongestArea: areas[areas.length - 1].areaName,
      weakestArea: areas[0].areaName,
      areas,
      generalRecommendations: this.buildGeneralRecommendations(
        overallAverage,
        areas,
      ),
    };
  }

  async analyzeStudentArea(
    studentId: string,
    areaId: string,
  ): Promise<AreaAnalysis> {
    await this.studentsService.findOne(studentId);
    const area = await this.areasService.findOne(areaId);
    const grades = await this.gradesService.findAll({ studentId, areaId });
    if (grades.length === 0) {
      throw new NotFoundException(
        `Student "${studentId}" has no grades in area "${area.name}"`,
      );
    }
    return this.buildAreaAnalysis(area, grades);
  }

  private buildAreaAnalysis(area: Area, grades: Grade[]): AreaAnalysis {
    const scores = grades.map((grade) => grade.score);
    const average = round(mean(scores));
    const level = levelFor(average);
    const trend = trendFor(grades);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    return {
      areaId: area.id,
      areaName: area.name,
      average,
      highestScore,
      lowestScore,
      gradesCount: grades.length,
      level,
      trend,
      recommendations: this.buildAreaRecommendations(
        area.name,
        level,
        trend,
        highestScore - lowestScore,
      ),
    };
  }

  private buildAreaRecommendations(
    areaName: string,
    level: PerformanceLevel,
    trend: Trend,
    scoreRange: number,
  ): string[] {
    const recommendations: string[] = [];

    switch (level) {
      case PerformanceLevel.LOW:
        recommendations.push(
          `Refuerza los conceptos básicos de ${areaName} con sesiones cortas de estudio diario (30-45 minutos).`,
          `Solicita tutoría o acompañamiento del docente de ${areaName} para resolver dudas puntuales.`,
          'Repasa las evaluaciones anteriores y corrige cada error para identificar los temas que debes volver a estudiar.',
        );
        break;
      case PerformanceLevel.BASIC:
        recommendations.push(
          `Dedica al menos 3 sesiones de práctica por semana a ${areaName} con ejercicios de dificultad progresiva.`,
          'Elabora resúmenes o mapas conceptuales de cada tema para consolidar lo aprendido.',
        );
        break;
      case PerformanceLevel.HIGH:
        recommendations.push(
          `Mantén tu ritmo de estudio en ${areaName} y practica con ejercicios de mayor dificultad para alcanzar el nivel superior.`,
        );
        break;
      case PerformanceLevel.SUPERIOR:
        recommendations.push(
          `Excelente desempeño en ${areaName}. Profundiza con proyectos, lecturas avanzadas u olimpiadas académicas.`,
          'Considera apoyar a tus compañeros como monitor: enseñar refuerza tu propio aprendizaje.',
        );
        break;
    }

    if (trend === Trend.DECLINING) {
      recommendations.push(
        `Tus notas en ${areaName} vienen bajando: revisa qué cambió en tus hábitos de estudio y retoma los temas más recientes.`,
      );
    } else if (trend === Trend.IMPROVING) {
      recommendations.push(
        `Tus notas en ${areaName} vienen mejorando: continúa con la estrategia de estudio que estás aplicando.`,
      );
    }

    if (scoreRange >= INCONSISTENCY_THRESHOLD) {
      recommendations.push(
        `Tus resultados en ${areaName} son irregulares: establece un horario fijo de estudio y prepárate con anticipación para cada evaluación.`,
      );
    }

    return recommendations;
  }

  // Expects areas sorted by average, lowest first.
  private buildGeneralRecommendations(
    overallAverage: number,
    areas: AreaAnalysis[],
  ): string[] {
    const recommendations: string[] = [];
    const failing = areas.filter((area) => area.average < PASSING_SCORE);
    const weakest = areas[0];
    const strongest = areas[areas.length - 1];

    if (failing.length > 0) {
      const names = failing.map((area) => area.areaName).join(', ');
      recommendations.push(
        `Prioriza las áreas que estás perdiendo (${names}): asígnales las primeras horas de tu jornada de estudio.`,
      );
    }

    if (strongest.average > weakest.average) {
      recommendations.push(
        `Tu área más fuerte es ${strongest.areaName} y la que más atención necesita es ${weakest.areaName}. Distribuye tu tiempo dando más horas a ${weakest.areaName}.`,
      );
    }

    if (overallAverage < PASSING_SCORE) {
      recommendations.push(
        'Tu promedio general está por debajo de la nota aprobatoria. Construye un plan de estudio semanal y revísalo con tu docente o acudiente.',
      );
    } else if (overallAverage < HIGH_SCORE) {
      recommendations.push(
        'Tu promedio general es aprobatorio. Usa técnicas de estudio activo (autoevaluaciones, repetición espaciada) para subir al siguiente nivel.',
      );
    } else {
      recommendations.push(
        'Tu promedio general es sobresaliente. Mantén tus hábitos de estudio y descansa lo suficiente para sostener el rendimiento.',
      );
    }

    return recommendations;
  }
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function levelFor(average: number): PerformanceLevel {
  if (average >= SUPERIOR_SCORE) return PerformanceLevel.SUPERIOR;
  if (average >= HIGH_SCORE) return PerformanceLevel.HIGH;
  if (average >= PASSING_SCORE) return PerformanceLevel.BASIC;
  return PerformanceLevel.LOW;
}

// Compares the average of the most recent half of the grades against the older half.
function trendFor(grades: Grade[]): Trend {
  if (grades.length < 2) return Trend.INSUFFICIENT_DATA;

  const ordered = [...grades].sort(
    (a, b) =>
      a.period - b.period || a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const half = Math.floor(ordered.length / 2);
  const older = mean(ordered.slice(0, half).map((grade) => grade.score));
  const recent = mean(
    ordered.slice(ordered.length - half).map((grade) => grade.score),
  );
  const difference = recent - older;

  if (difference >= TREND_THRESHOLD) return Trend.IMPROVING;
  if (difference <= -TREND_THRESHOLD) return Trend.DECLINING;
  return Trend.STABLE;
}
