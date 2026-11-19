// Students per performance level. Keys match the PerformanceLevel values.
export class LevelCounts {
  BAJO: number;
  BASICO: number;
  ALTO: number;
  SUPERIOR: number;
}

export class GradeLevelAreaSummary {
  areaId: string;
  areaName: string;
  /** Promedio de los promedios de los estudiantes en la materia. */
  average: number;
  /** Estudiantes del grado con notas en la materia. */
  studentsCount: number;
}

export class StudentAtRisk {
  studentId: string;
  studentName: string;
  overallAverage: number;
  weakestArea: string;
}

export class GradeLevelReport {
  gradeLevel: string;
  studentsCount: number;
  /** Estudiantes que ya tienen al menos una nota. */
  studentsWithGrades: number;
  overallAverage: number | null;
  levels: LevelCounts;
  /** Ordenadas de la más baja a la más alta. */
  areas: GradeLevelAreaSummary[];
  /** Estudiantes con promedio general menor a 3.0, del más bajo al más alto. */
  studentsAtRisk: StudentAtRisk[];
}
