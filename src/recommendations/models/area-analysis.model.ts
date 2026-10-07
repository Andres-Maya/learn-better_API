import { PerformanceLevel } from './performance-level.enum';
import { Trend } from './trend.enum';

export class AreaAnalysis {
  areaId: string;
  areaName: string;
  average: number;
  highestScore: number;
  lowestScore: number;
  gradesCount: number;
  level: PerformanceLevel;
  trend: Trend;
  recommendations: string[];
}
