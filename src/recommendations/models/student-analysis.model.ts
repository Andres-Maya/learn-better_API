import { AreaAnalysis } from './area-analysis.model';
import { PerformanceLevel } from './performance-level.enum';

export class StudentAnalysis {
  studentId: string;
  studentName: string;
  overallAverage: number | null;
  level: PerformanceLevel | null;
  strongestArea: string | null;
  weakestArea: string | null;
  areas: AreaAnalysis[];
  generalRecommendations: string[];
}
