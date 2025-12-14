
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
  horizon: HorizonLevel; 
  // New fields for 360 multi-tagging
  categories?: string[];
  roles?: string[];
  horizons?: HorizonLevel[];
}

export interface DilemmaOption {
  text: string;
  value: number; // 1 (Low), 3 (Med), 5 (High)
}

export interface Dilemma {
  id: string;
  title: string;
  scenario: string;
  block: string;    // To map to scoring
  axis: string;     // To map to scoring
  category: string; // To map to scoring
  role: string;     // Primary Role
  secondaryRole?: string; // Secondary Role for validation
  horizon: HorizonLevel; // Added specific horizon
  options: DilemmaOption[];
  lowScoreRecommendation?: string; // Recommendation text for low score (1)
}

export interface DescriptiveQuestion {
  id: number;
  theme: string;
  category: string;
  text: string;
}

export interface UserProfile {
  name: string;
  email: string;
  company: string;   
  role: string;      
  whatsapp: string;  
  level: LeadershipLevel;
  // New 360 fields
  is360?: boolean;
  targetLeaderName?: string;
}

// Answers can now hold number IDs (questions) or string IDs (dilemmas)
// Null represents an omission (time out)
export type Answers = Record<number | string, number | null>;
export type TextAnswers = Record<number, string>;

export interface RoleResult {
  score: number;
  horizons: Record<number, number>;
}

export interface BlockResult {
  score: number;
  horizon: number; // Dominant horizon for the block
}

export interface MatrixResult {
  x: number; // People
  y: number; // Results
  quadrant: number;
  quadrantName: string;
}

export interface CategoryValidation {
  status: 'Consistent' | 'Inconsistent';
  stdDev: number; // Standard Deviation
}

export interface OmissionAnalysis {
    count: number;
    percentage: number;
    readinessIndex: number; // 0-100
    mainImpactedCategories: string[]; // Categories with most omissions
    interpretation: string; // Qualitative text
}

export interface ConsistencyResult {
  stdDev: number;
  status: 'Consistente' | 'Balanceado' | 'Desbalanceado' | 'Fragmentado' | 'Contraditório';
  message: string;
  internalInconsistencies: string[]; // List of specific warnings based on question mapping
  categoryDetails: Record<string, CategoryValidation>; // New detailed breakdown
}

export interface RoleValidation {
  alerts: string[];
}

export interface ScoreResult {
  total: number; // 0-100
  matrix: MatrixResult;
  roles: Record<string, RoleResult>;
  horizons: Record<number, number>; // H0-H4 averages
  consistency: ConsistencyResult;
  roleValidation: RoleValidation; // Validation from dilemmas
  predominantHorizon: number; // Color coding
  blocks: Record<string, BlockResult>; // Changed to store score and horizon
  categories: Record<string, number>;
  omissionAnalysis: OmissionAnalysis; // New Field for Time/Pressure analysis
}