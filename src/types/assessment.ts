// src/types/assessment.ts
// TypeScript type definitions for ARTH.OS financial assessment

/**
 * Raw assessment input from the user
 */
export interface AssessmentInput {
  // Participant
  age: number;

  // Behaviour (0-100 scale)
  impulseBuyingFrequency: number;
  impulseBuyingSeverity: number;
  stressFinancialResponse: number;
  routineDeviation: number;

  // Awareness (0-100 scale)
  financialLiteracy: number;
  budgetingAwareness: number;
  investmentKnowledge: number;
  monitoringFrequency: number;

  // Profile
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFund: number;
  debt: number;
  dependents: number;
  savingsTendency: number;
  existingSavings: number;
}

/**
 * Individual component scores (0-100)
 */
export interface ComponentScores {
  behaviour: number;
  awareness: number;
  stability: number;
}

/**
 * Visibility blindspot analysis
 */
export interface BlindspotData {
  perceivedMonths: number;
  actualMonths: number;
  insight: string;
  cognitiveDissonance: number; // 0-100, how much user misperceives
}

/**
 * Core financial health assessment result
 */
export interface HealthScore {
  healthScore: number; // 0-1000 scale
  componentScores: ComponentScores;
  survivalMonths: number;
  blindSpotData?: BlindspotData;
  recommendedActions: string[];
  assessmentTimestamp: Date;
}

/**
 * Health status band classification
 */
export type HealthBand = "Critical" | "Fragile" | "Developing" | "Resilient" | "Sovereign";

/**
 * Get health band from score
 */
export function getHealthBand(score: number): HealthBand {
  if (score < 200) return "Critical";
  if (score < 400) return "Fragile";
  if (score < 600) return "Developing";
  if (score < 800) return "Resilient";
  return "Sovereign";
}

/**
 * User profile for persistence
 */
export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  age: number;
  createdAt: Date;
  lastAssessmentAt?: Date;
  assessmentCount: number;
}

/**
 * Assessment history entry
 */
export interface AssessmentHistory {
  id: string;
  userId: string;
  assessment: AssessmentInput;
  result: HealthScore;
  createdAt: Date;
  notes?: string;
}

/**
 * Anonymous telemetry data sent to server
 */
export interface TelemetryPayload {
  healthScore: number;
  healthBand: HealthBand;
  survivalMonths: number;
  behaviourScore: number;
  awarenessScore: number;
  stabilityScore: number;
  debtToIncomeRatio: number;
  savingsRatio: number;
  hasEmergencyFund: boolean;
  dependentCount: number;
  timestamp: string; // ISO date only, no time
  userAgent?: string;
}

/**
 * Feedback data sent after assessment
 */
export interface FeedbackPayload {
  userId?: string;
  healthScore: number;
  comment?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  timestamp: Date;
}

/**
 * API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Error tracking context
 */
export interface ErrorContext {
  type: "uncaught_error" | "unhandled_rejection" | "api_error" | "component_error";
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
}
