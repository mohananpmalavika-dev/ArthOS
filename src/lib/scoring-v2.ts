/**
 * src/lib/scoring-v2.ts
 * TypeScript wrapper for BAST scoring engine with full type safety
 * 
 * This file re-exports all functions from scoring-v2.js with TypeScript type annotations.
 * The original scoring-v2.js remains unchanged for backward compatibility.
 */

import * as ScoringEngine from "./scoring-v2.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Behaviour component input (0-100 scale for each metric)
 */
export interface BehaviourInput {
  emotionalMoneyLevel?: string;
  socialInfluenceLevel?: string;
  unplannedPurchaseFreq?: string;
  regretImpulseFreq?: string;
  presentFutureMindset?: string;
  avoidBalanceDuringStress?: string;
  spendWhenBored?: string;
  spendWhenStressed?: string;
  plannedPurchasesOnly?: string;
  [key: string]: string | number | undefined;
}

/**
 * Awareness component input (0-100 scale for each metric)
 */
export interface AwarenessInput {
  financialLiteracy?: string;
  budgetingAwareness?: string;
  investmentKnowledge?: string;
  monitoringFrequency?: string;
  spendingTrackingFrequency?: string;
  goalsPlanningFrequency?: string;
  debtAwarenessLevel?: string;
  emergencyPlanning?: string;
  [key: string]: string | number | undefined;
}

/**
 * Profile/Stability input
 */
export interface ProfileInput {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  emergencyFund?: number;
  debt?: number;
  dependents?: number;
  savingsTendency?: number;
  existingSavings?: number;
  [key: string]: number | undefined;
}

/**
 * Habits input
 */
export interface HabitsInput {
  checkInFrequency?: string;
  monitoringReliability?: string;
  budgetRevisionFrequency?: string;
  [key: string]: string | undefined;
}

/**
 * Complete assessment input
 */
export interface AssessmentV2Input {
  behaviour?: BehaviourInput;
  awareness?: AwarenessInput;
  profile?: ProfileInput;
  habits?: HabitsInput;
  [key: string]: unknown;
}

/**
 * Component row in detailed breakdown
 */
export interface ComponentRow {
  key: "behaviour" | "awareness" | "stability";
  label: string;
  score: number;
  max: number;
  band: string;
  compositeContribution: number;
  percent: number;
  compositePercent: number;
}

/**
 * Survival band classification
 */
export interface SurvivalBand {
  label: string;
  tone: "critical" | "warning" | "steady" | "strong";
}

/**
 * Health score band
 */
export interface HealthBandInfo {
  min: number;
  max: number;
  label: string;
}

/**
 * Awareness metrics with cognitive drift
 */
export interface AwarenessMetrics {
  perceivedSurvivalMonths: number;
  actualSurvivalMonths: number;
  awarenessGap: number;
  cognitiveDissonance: number;
}

/**
 * Blind spot data
 */
export interface BlindSpotData {
  headline: string;
  summary: string;
  perceivedSurvivalMonthsDisplay: string;
  actualSurvivalMonthsDisplay: string;
  gapDisplay: string;
  direction: "underestimate" | "overestimate";
}

/**
 * Debt schedule estimate
 */
export interface DebtSchedule {
  monthlyPayment: number;
  totalInterest: number;
  payoffMonths: number;
  interestRate: number;
}

/**
 * Future risk assessment
 */
export interface FutureRisk {
  score: number;
  label: string;
  factors: string[];
}

/**
 * Personality type classification
 */
export interface PersonalityType {
  primary: string;
  secondary: string;
  riskProfile: string;
}

/**
 * Personality report
 */
export interface PersonalityReport {
  type: string;
  strengths: string[];
  blindSpots: string[];
  recommendations: string[];
}

/**
 * Main financial health score result
 * This is the comprehensive return type of calculateFinancialHealthV2()
 */
export interface FinancialHealthV2Result {
  // Core scores (0-1000 and 0-40/30/30)
  mode: "v2";
  healthScore: number;
  behaviourScore: number;
  awarenessScore: number;
  stabilityScore: number;
  categoryBand: HealthBandInfo;

  // Survival metrics
  survivalMonthsRaw: number;
  survivalMonthsDisplay: string;
  bareMinimumSurvivalMonthsRaw: number;
  bareMinimumSurvivalMonthsDisplay: string;
  activeElasticityFactor: number;
  activeElasticityPercent: number;
  survivalBand: SurvivalBand;

  // Buffer breakdown
  fixedBufferMonths: number;
  discretionaryBufferMonths: number;
  fixedBufferMonthsDisplay: string;
  discretionaryBufferMonthsDisplay: string;
  fixedBufferAmount: number;
  discretionaryBufferAmount: number;
  totalEmergencySavings: number;

  // Component analysis
  componentRows: ComponentRow[];
  lowestComponent: ComponentRow;
  strongestComponent: ComponentRow;

  // Actions and recommendations
  recommendedActionText: string;

  // Detailed metrics
  debtSchedule: DebtSchedule;
  habits: HabitsInput;
  futureRiskScore: number;
  futureRiskLabel: string;

  // Personality and behavior
  personalityType: PersonalityType;
  personalityReport: PersonalityReport;

  // Awareness and blindspots
  awarenessMetrics: AwarenessMetrics;
  blindSpot: BlindSpotData;
  perceivedSurvivalMonths: number;
  perceivedSurvivalMonthsDisplay: string;
  actualSurvivalMonths: number;
  awarenessGap: number;
  awarenessGapDisplay: string;
  blindSpotHeadline: string;
  blindSpotSummary: string;
  blindSpotPerceived: string;
  blindSpotActual: string;
  blindSpotGap: string;
  blindSpotDirection: "underestimate" | "overestimate";

  // Diagnosis and summary
  diagnosis: string;
  summary: string;
}

/**
 * Dynamic elasticity result
 */
export interface DynamicElasticityResult {
  factor: number;
  percent: number;
  description: string;
}

/**
 * Decision simulator result
 */
export interface DecisionSimulatorResult {
  impactOnSurvivalMonths: number;
  impactPercent: number;
  newTotalEmergencySavings: number;
  isAffordable: boolean;
  recommendation: string;
}

/**
 * Telemetry payload
 */
export interface TelemetryPayloadV2 {
  healthScore: number;
  behaviourScore: number;
  awarenessScore: number;
  stabilityScore: number;
  survivalMonths: number;
  healthBand: string;
  debtToIncomeRatio: number;
  savingsRatio: number;
  dependentCount: number;
  timestamp: string;
}

// ============================================================================
// EXPORT CONSTANTS WITH TYPES
// ============================================================================

export const componentMaximumsV2: {
  behaviour: number;
  awareness: number;
  stability: number;
} = ScoringEngine.componentMaximumsV2;

export const compositeWeightsV2: {
  behaviour: number;
  awareness: number;
  stability: number;
} = ScoringEngine.compositeWeightsV2;

export const healthScoreBandsV2: Record<string, HealthBandInfo> =
  ScoringEngine.healthScoreBandsV2;

// ============================================================================
// EXPORT UTILITY FUNCTIONS WITH TYPE SIGNATURES
// ============================================================================

/**
 * Format number as Indian Rupee currency
 */
export function formatCurrency(value: number | null | undefined): string {
  return ScoringEngine.formatCurrency(value) as string;
}

/**
 * Format number of months as display string
 */
export function formatMonths(months: number | null | undefined): string {
  return ScoringEngine.formatMonths(months) as string;
}

// ============================================================================
// EXPORT SCORING FUNCTIONS WITH TYPE SIGNATURES
// ============================================================================

/**
 * Calculate behaviour component score (0-40 scale)
 */
export function calculateBehaviourScoreV2(
  behaviour?: BehaviourInput | null
): number {
  return ScoringEngine.calculateBehaviourScoreV2(behaviour) as number;
}

/**
 * Calculate awareness component score (0-30 scale)
 */
export function calculateAwarenessScoreV2(
  awareness?: AwarenessInput | null
): number {
  return ScoringEngine.calculateAwarenessScoreV2(awareness) as number;
}

/**
 * Calculate stability component score and metrics (0-30 scale)
 */
export function calculateStabilityScoreV2(
  profile?: ProfileInput | null,
  behaviour?: BehaviourInput | null
): {
  score: number;
  survivalMonthsRaw: number;
  bareMinimumSurvivalMonthsRaw: number;
  activeElasticityFactor: number;
  fixedBufferMonths: number;
  discretionaryBufferMonths: number;
  fixedEmergencySavings: number;
  discretionaryEmergencySavings: number;
  totalEmergencySavings: number;
} {
  return ScoringEngine.calculateStabilityScoreV2(profile, behaviour) as any;
}

/**
 * Calculate debt schedule estimate
 */
export function calculateDebtScheduleEstimateV2(
  profile?: ProfileInput | null
): DebtSchedule {
  return ScoringEngine.calculateDebtScheduleEstimateV2(profile) as DebtSchedule;
}

/**
 * Calculate habits metrics
 */
export function calculateHabitsMetricsV2(habits?: HabitsInput | null): HabitsInput {
  return ScoringEngine.calculateHabitsMetricsV2(habits) as HabitsInput;
}

/**
 * Calculate future risk assessment
 */
export function calculateFutureRiskV2(profile?: ProfileInput | null): FutureRisk {
  return ScoringEngine.calculateFutureRiskV2(profile) as FutureRisk;
}

/**
 * Calculate personality type from behaviour
 */
export function calculatePersonalityTypeV2(
  behaviour?: BehaviourInput | null
): PersonalityType {
  return ScoringEngine.calculatePersonalityTypeV2(behaviour) as PersonalityType;
}

/**
 * Get personality report from personality type
 */
export function calculatePersonalityReportV2(
  personalityType?: PersonalityType | null
): PersonalityReport {
  return ScoringEngine.calculatePersonalityReportV2(personalityType) as PersonalityReport;
}

/**
 * Calculate awareness gap with cognitive drift
 */
export function calculateAdvancedCognitiveDrift(
  awareness?: AwarenessInput | null,
  actualSurvivalMonths?: number
): AwarenessMetrics {
  return ScoringEngine.calculateAdvancedCognitiveDrift(
    awareness,
    actualSurvivalMonths
  ) as AwarenessMetrics;
}

/**
 * Calculate awareness gap (perceived vs actual survival months)
 */
export function calculateAwarenessGapV2(
  awarenessOrScore?: AwarenessInput | number | null,
  survivalMonthsRaw?: number
): number {
  return ScoringEngine.calculateAwarenessGapV2(
    awarenessOrScore,
    survivalMonthsRaw
  ) as number;
}

/**
 * Calculate blind spot analysis
 */
export function calculateBlindSpotV2(
  awarenessMetrics?: AwarenessMetrics | null
): BlindSpotData {
  return ScoringEngine.calculateBlindSpotV2(awarenessMetrics) as BlindSpotData;
}

/**
 * Calculate dynamic elasticity factor (how flexible spending can be)
 */
export function calculateDynamicElasticity(
  behaviour?: BehaviourInput | null
): DynamicElasticityResult {
  return ScoringEngine.calculateDynamicElasticity(behaviour) as DynamicElasticityResult;
}

/**
 * Simulate impact of a commitment (purchase) on survival months
 */
export function simulateCommitmentImpact(
  profile?: ProfileInput | null,
  simulatedItemCost?: number,
  behaviour?: BehaviourInput | null
): {
  impactOnSurvivalMonths: number;
  impactPercent: number;
  newTotalEmergencySavings: number;
  isAffordable: boolean;
  recommendation: string;
} {
  return ScoringEngine.simulateCommitmentImpact(
    profile,
    simulatedItemCost,
    behaviour
  ) as any;
}

/**
 * Calculate decision simulator - predict impact of a purchase decision
 */
export function calculateDecisionSimulatorV2(
  profile?: ProfileInput | null,
  purchaseCost?: number,
  behaviour?: BehaviourInput | null
): DecisionSimulatorResult {
  return ScoringEngine.calculateDecisionSimulatorV2(
    profile,
    purchaseCost,
    behaviour
  ) as DecisionSimulatorResult;
}

/**
 * MAIN FUNCTION: Calculate complete financial health assessment
 * 
 * @param assessment - Complete assessment input with behaviour, awareness, profile
 * @returns Comprehensive financial health result with all metrics, recommendations, and analysis
 * 
 * @example
 * const result = calculateFinancialHealthV2({
 *   behaviour: { emotionalMoneyLevel: "mostly_practical" },
 *   awareness: { financialLiteracy: "70" },
 *   profile: { monthlyIncome: 100000, monthlyExpenses: 30000 }
 * });
 * console.log(result.healthScore); // 0-1000
 * console.log(result.categoryBand.label); // "Resilient"
 */
export function calculateFinancialHealthV2(
  assessment?: AssessmentV2Input | null
): FinancialHealthV2Result {
  return ScoringEngine.calculateFinancialHealthV2(assessment) as FinancialHealthV2Result;
}

/**
 * Build anonymous telemetry payload for tracking
 */
export function buildAnonymousTelemetryPayload(
  assessmentResult?: FinancialHealthV2Result | null,
  coreAssessment?: AssessmentV2Input | null
): TelemetryPayloadV2 {
  return ScoringEngine.buildAnonymousTelemetryPayload(
    assessmentResult,
    coreAssessment
  ) as TelemetryPayloadV2;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  calculateFinancialHealthV2,
  calculateBehaviourScoreV2,
  calculateAwarenessScoreV2,
  calculateStabilityScoreV2,
  formatCurrency,
  formatMonths,
  buildAnonymousTelemetryPayload,
};
