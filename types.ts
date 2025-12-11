export enum LeadershipLevel {
  L1 = 'L1', // Líder de Si
  L2 = 'L2', // Líder de Outros
  L3 = 'L3', // Líder de Líderes
  L4 = 'L4', // Líder Organizacional
  Comum = 'Comum' // Questions applicable to all
}

export type HorizonLevel = 0 | 1 | 2 | 3 | 4;

export interface Question {
  id: number;
  text: string;
  block: string;
  level: LeadershipLevel;
  axis: string;
  category: string;
  role: string;
  inverted: boolean;
  horizon: HorizonLevel; // Added Horizon H0-H4
}

export interface UserProfile {
  name: string;
  email: string;
  level: LeadershipLevel;
}

export type Answers = Record<number, number>;

export interface RoleResult {
  score: number;
  horizons: Record<number, number>;
}

export interface MatrixResult {
  x: number; // People
  y: number; // Results
  quadrant: number;
  quadrantName: string;
}

export interface ConsistencyResult {
  stdDev: number;
  status: 'Consistente' | 'Balanceado' | 'Desbalanceado' | 'Fragmentado' | 'Contraditório';
  message: string;
  internalInconsistencies: string[]; // List of specific warnings based on question mapping
}

export interface ScoreResult {
  total: number; // 0-100
  matrix: MatrixResult;
  roles: Record<string, RoleResult>;
  horizons: Record<number, number>; // H0-H4 averages
  consistency: ConsistencyResult;
  predominantHorizon: number; // Color coding
  blocks: Record<string, number>;
  categories: Record<string, number>;
}