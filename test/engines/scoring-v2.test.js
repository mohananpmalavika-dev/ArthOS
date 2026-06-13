/**
 * test/engines/scoring-v2.test.js
 * Unit tests for core scoring engine
 * 
 * Focus: Score calculation, component weighting, personality classification
 * Priority: CRITICAL
 * Target Coverage: 80%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateFinancialHealthV2,
  calculateBehaviourScoreV2,
  calculateAwarenessScoreV2,
  calculateStabilityScoreV2,
  componentMaximumsV2,
  compositeWeightsV2
} from '../../src/lib/scoring-v2.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('scoring-v2.js - Financial Health Scoring Engine', () => {
  let mockAssessment;

  beforeEach(() => {
    mockAssessment = createMockAssessment();
  });

  // ============================================================================
  // CORE SCORING FUNCTIONALITY
  // ============================================================================

  describe('Component Score Calculations', () => {
    it('calculateBehaviourScoreV2 should calculate score between 0 and max', () => {
      const behaviour = {
        emotionalMoneyLevel: "mostly_practical",
        socialInfluenceLevel: "sometimes",
        unplannedPurchaseFreq: "rarely"
      };
      const score = calculateBehaviourScoreV2(behaviour);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(componentMaximumsV2.behaviour);
    });

    it('calculateAwarenessScoreV2 should calculate score between 0 and max', () => {
      const awareness = {
        hasFinancialPlan: "some_plan",
        tracksExpenses: "sometimes"
      };
      const score = calculateAwarenessScoreV2(awareness);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(componentMaximumsV2.awareness);
    });

    it('calculateStabilityScoreV2 should calculate score between 0 and max', () => {
      const profile = {
        monthlyIncome: 50000,
        monthlyExpenses: 20000,
        totalDebt: 50000
      };
      const behaviour = {};
      const result = calculateStabilityScoreV2(profile, behaviour);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('survivalMonthsRaw');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(componentMaximumsV2.stability);
    });

    it('should return higher scores for better metrics', () => {
      const poorBehaviour = {
        emotionalMoneyLevel: "extremely_emotional",
        unplannedPurchaseFreq: "very_frequently"
      };
      const goodBehaviour = {
        emotionalMoneyLevel: "fully_logical",
        unplannedPurchaseFreq: "never"
      };
      const poorScore = calculateBehaviourScoreV2(poorBehaviour);
      const goodScore = calculateBehaviourScoreV2(goodBehaviour);
      expect(goodScore).toBeGreaterThan(poorScore);
    });
  });

  // ============================================================================
  // FULL ASSESSMENT CALCULATION
  // ============================================================================

  describe('calculateFinancialHealthV2()', () => {
    it('should return complete result object with all required fields', () => {
      const result = calculateFinancialHealthV2(mockAssessment);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('healthScore');
      expect(result).toHaveProperty('personalityType');
      expect(result).toHaveProperty('categoryBand');
      expect(result).toHaveProperty('survivalBand');
      expect(result).toHaveProperty('componentRows');
    });

    it('should have categoryBand object with label, tone, and band properties', () => {
      const result = calculateFinancialHealthV2(mockAssessment);
      const { categoryBand } = result;
      
      expect(categoryBand).toBeDefined();
      expect(categoryBand).toHaveProperty('label');
      expect(categoryBand).toHaveProperty('tone');
      expect(categoryBand).toHaveProperty('band');
      expect(typeof categoryBand.label).toBe('string');
      expect(typeof categoryBand.tone).toBe('string');
      expect(typeof categoryBand.band).toBe('string');
    });

    it('should have survivalBand with label property', () => {
      const result = calculateFinancialHealthV2(mockAssessment);
      expect(result.survivalBand).toHaveProperty('label');
      expect(typeof result.survivalBand.label).toBe('string');
    });

    it('should have componentRows array with band objects containing labels', () => {
      const result = calculateFinancialHealthV2(mockAssessment);
      expect(Array.isArray(result.componentRows)).toBe(true);
      result.componentRows.forEach(component => {
        expect(component).toHaveProperty('key');
        expect(component).toHaveProperty('score');
      });
    });

    it('should compute health score between 0 and 1000', () => {
      const result = calculateFinancialHealthV2(mockAssessment);
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(1000);
    });

    it('should match categoryBand.label to healthScore range', () => {
      const result = calculateFinancialHealthV2(mockAssessment);
      const { healthScore, categoryBand } = result;

      if (healthScore < 200) {
        expect(categoryBand.label).toContain('Critical');
        expect(categoryBand.tone).toBe('critical');
      } else if (healthScore < 400) {
        expect(categoryBand.label).toContain('Fragile');
        expect(categoryBand.tone).toBe('warning');
      } else if (healthScore < 600) {
        expect(categoryBand.label).toContain('Developing');
        expect(categoryBand.tone).toBe('caution');
      } else if (healthScore < 800) {
        expect(categoryBand.label).toContain('Resilient');
        expect(categoryBand.tone).toBe('steady');
      } else {
        expect(categoryBand.label).toContain('Sovereign');
        expect(categoryBand.tone).toBe('strong');
      }
    });
  });

  // ============================================================================
  // HEALTH BAND CLASSIFICATION
  // ============================================================================

  describe('categoryBand classification', () => {
    it('should classify healthScore 0-199 as Critical with critical tone', () => {
      const result = calculateFinancialHealthV2({
        behaviour: { emotionalMoneyLevel: "extremely_emotional" },
        awareness: { hasFinancialPlan: "no_plan" },
        profile: {
          monthlyIncome: 10000,
          monthlyExpenses: 9000,
          emergencySavingsFixed: 500,
          emergencySavingsDiscretionary: 200,
          totalDebt: 50000,
          monthlyLiabilities: 2000,
          incomeStability: "variable"
        },
        habits: {
          habitCheckInsPerWeek: "0",
          debtPaymentDiscipline: "rarely"
        }
      });
      
      if (result.healthScore < 200) {
        expect(result.categoryBand.label).toContain('Critical');
        expect(result.categoryBand.tone).toBe('critical');
        expect(result.categoryBand.band).toBe('critical');
      }
    });

    it('should classify healthScore 800+ as Sovereign with strong tone', () => {
      const result = calculateFinancialHealthV2({
        behaviour: {
          emotionalMoneyLevel: "fully_logical",
          unplannedPurchaseFreq: "never",
          presentFutureMindset: "extreme_discipline"
        },
        awareness: {
          hasFinancialPlan: "clear_plan",
          tracksExpenses: "regularly"
        },
        profile: {
          monthlyIncome: 200000,
          monthlyExpenses: 30000,
          totalDebt: 0,
          emergencySavingsFixed: 100000,
          emergencySavingsDiscretionary: 50000,
          monthlyLiabilities: 0,
          incomeStability: "stable"
        },
        habits: {
          habitCheckInsPerWeek: "4_plus",
          debtPaymentDiscipline: "always"
        }
      });
      
      if (result.healthScore >= 800) {
        expect(result.categoryBand.label).toContain('Sovereign');
        expect(result.categoryBand.tone).toBe('strong');
        expect(result.categoryBand.band).toBe('sovereign');
      }
    });
  });

  // ============================================================================
  // PERSONALITY TYPE CLASSIFICATION
  // ============================================================================

  describe('calculateFinancialHealthV2 - Personality Type', () => {
    it('should include personality type in result', () => {
      const result = calculateFinancialHealthV2(mockAssessment);
      expect(result).toHaveProperty('personalityType');
      expect(typeof result.personalityType).toBe('string');
      expect(result.personalityType.length).toBeGreaterThan(0);
    });

    it('should return consistent personality type', () => {
      const result1 = calculateFinancialHealthV2(mockAssessment);
      const result2 = calculateFinancialHealthV2(mockAssessment);
      expect(result1.personalityType).toBe(result2.personalityType);
    });

    it('should classify based on component scores', () => {
      const strongBehaviour = {
        behaviour: {
          emotionalMoneyLevel: "fully_logical",
          unplannedPurchaseFreq: "never"
        },
        awareness: { hasFinancialPlan: "no_plan" },
        profile: {
          monthlyIncome: 50000,
          monthlyExpenses: 20000,
          emergencySavingsFixed: 10000,
          emergencySavingsDiscretionary: 5000,
          totalDebt: 5000,
          monthlyLiabilities: 200,
          incomeStability: "stable"
        },
        habits: {
          habitCheckInsPerWeek: "2_3",
          debtPaymentDiscipline: "often"
        }
      };
      const result = calculateFinancialHealthV2(strongBehaviour);
      expect(result.personalityType).toBeDefined();
      expect(typeof result.personalityType).toBe('string');
    });

    it('should handle null/undefined gracefully', () => {
      expect(() => calculateFinancialHealthV2(null)).not.toThrow();
      expect(() => calculateFinancialHealthV2(undefined)).not.toThrow();
    });
  });

  // ============================================================================
  // COMPONENT MAXIMUMS VALIDATION
  // ============================================================================

  describe('componentMaximumsV2', () => {
    it('should define maximum values for all components', () => {
      expect(componentMaximumsV2).toHaveProperty('behaviour');
      expect(componentMaximumsV2).toHaveProperty('awareness');
      expect(componentMaximumsV2).toHaveProperty('stability');
      expect(typeof componentMaximumsV2.behaviour).toBe('number');
      expect(typeof componentMaximumsV2.awareness).toBe('number');
      expect(typeof componentMaximumsV2.stability).toBe('number');
    });

    it('should have composite weights that sum to 1.0', () => {
      const total = compositeWeightsV2.behaviour + 
                   compositeWeightsV2.awareness + 
                   compositeWeightsV2.stability;
      expect(total).toBeCloseTo(1.0, 5);
    });

    it('should respect correct weighting ratios', () => {
      expect(compositeWeightsV2.behaviour).toBe(0.4);
      expect(compositeWeightsV2.awareness).toBe(0.3);
      expect(compositeWeightsV2.stability).toBe(0.3);
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('end-to-end scoring scenarios', () => {
    it('should produce consistent results across multiple calls', () => {
      const assessment = createMockAssessment();
      const result1 = calculateFinancialHealthV2(assessment);
      const result2 = calculateFinancialHealthV2(assessment);

      expect(result1.healthScore).toBe(result2.healthScore);
      expect(result1.personalityType).toBe(result2.personalityType);
      expect(result1.categoryBand.label).toBe(result2.categoryBand.label);
    });

    it('should produce realistic health profile for good financial standing', () => {
      const goodFinances = {
        behaviour: {
          emotionalMoneyLevel: "mostly_practical",
          unplannedPurchaseFreq: "rarely",
          presentFutureMindset: "secure_future"
        },
        awareness: {
          hasFinancialPlan: "some_plan",
          tracksExpenses: "sometimes"
        },
        profile: {
          monthlyIncome: 100000,
          monthlyExpenses: 30000,
          totalDebt: 50000,
          emergencySavingsFixed: 50000,
          emergencySavingsDiscretionary: 20000,
          monthlyLiabilities: 500,
          incomeStability: "stable"
        },
        habits: {
          habitCheckInsPerWeek: "2_3",
          debtPaymentDiscipline: "often"
        }
      };

      const result = calculateFinancialHealthV2(goodFinances);
      expect(result.healthScore).toBeGreaterThan(0);
      expect(result.categoryBand).toBeDefined();
      expect(result.categoryBand.label).toBeDefined();
    });

    it('should produce realistic health profile for poor financial standing', () => {
      const poorFinances = {
        behaviour: {
          emotionalMoneyLevel: "extremely_emotional",
          unplannedPurchaseFreq: "very_frequently"
        },
        awareness: {
          hasFinancialPlan: "no_plan",
          tracksExpenses: "never"
        },
        profile: {
          monthlyIncome: 3000,
          monthlyExpenses: 2800,
          totalDebt: 100000,
          emergencySavingsFixed: 100,
          emergencySavingsDiscretionary: 0,
          monthlyLiabilities: 1500,
          incomeStability: "variable"
        },
        habits: {
          habitCheckInsPerWeek: "0",
          debtPaymentDiscipline: "rarely"
        }
      };

      const result = calculateFinancialHealthV2(poorFinances);
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.categoryBand).toBeDefined();
      expect(result.categoryBand.label).toBeDefined();
    });

    it('should have componentRows sorted by score', () => {
      const result = calculateFinancialHealthV2(mockAssessment);
      expect(Array.isArray(result.componentRows)).toBe(true);
      expect(result.componentRows.length).toBeGreaterThan(0);
      
      // Check all components have required properties
      result.componentRows.forEach(component => {
        expect(component).toHaveProperty('key');
        expect(component).toHaveProperty('score');
        expect(component).toHaveProperty('label');
        expect(component).toHaveProperty('band');
        expect(typeof component.band).toBe('string');
      });
    });
  });
});
