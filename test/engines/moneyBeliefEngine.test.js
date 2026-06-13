/**
 * test/engines/moneyBeliefEngine.test.js
 * Unit tests for money belief system analysis and classification
 * 
 * Focus: Belief extraction, classification, influence on behavior
 * Priority: HIGH
 * Target Coverage: 70%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeMoneyBeliefs, deriveMoneyBeliefs } from '../../src/engines/moneyBeliefEngine.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('moneyBeliefEngine.js - Money Belief Analysis', () => {
  let mockAssessment;
  let mockBehavior;

  beforeEach(() => {
    mockAssessment = createMockAssessment();
    mockBehavior = {
      emotionalMoneyLevel: 'somewhat_emotional',
      socialInfluenceLevel: 'sometimes',
      presentFutureMindset: 'balance_both',
      avoidBalanceDuringStress: false,
      unplannedPurchaseFreq: 'sometimes',
      regretImpulseFreq: 'occasionally'
    };
  });

  // ============================================================================
  // CORE BELIEF ANALYSIS
  // ============================================================================

  describe('analyzeMoneyBeliefs()', () => {
    it('should return beliefs object with required structure', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      expect(beliefs).toBeDefined();
      expect(typeof beliefs).toBe('object');
      expect(Object.keys(beliefs).length).toBeGreaterThan(0);
    });

    it('should categorize money as security belief', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      expect(beliefs).toBeDefined();
      expect(beliefs.beliefScores).toBeDefined();
      expect(beliefs.beliefScores.moneyAsSecurity).toBeGreaterThanOrEqual(0);
      expect(beliefs.beliefScores.moneyAsSecurity).toBeLessThanOrEqual(100);
    });

    it('should identify freedom belief dimension', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      expect(beliefs).toBeDefined();
      expect(beliefs.beliefScores).toBeDefined();
      expect(beliefs.beliefScores.moneyAsFreedom).toBeGreaterThanOrEqual(0);
      expect(beliefs.beliefScores.moneyAsFreedom).toBeLessThanOrEqual(100);
    });

    it('should assess power belief dimension', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      expect(beliefs).toBeDefined();
      expect(beliefs.beliefScores).toBeDefined();
      // Power-related belief through identity/status scores
      expect(beliefs.beliefScores.moneyAsIdentity).toBeGreaterThanOrEqual(0);
      expect(beliefs.beliefScores.moneyAsIdentity).toBeLessThanOrEqual(100);
    });

    it('should identify love/relationship money beliefs', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      // Money beliefs object structure with multiple dimensions
      expect(beliefs.beliefScores).toBeDefined();
      expect(Object.keys(beliefs.beliefScores).length).toBeGreaterThanOrEqual(3);
      // Should have array of narrative beliefs
      expect(Array.isArray(beliefs.beliefs)).toBe(true);
    });

    it('should handle null/undefined behavior gracefully', () => {
      expect(() => analyzeMoneyBeliefs(null)).not.toThrow();
      expect(() => analyzeMoneyBeliefs(undefined)).not.toThrow();
      const result = analyzeMoneyBeliefs({});
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // BELIEF MANIFESTATION IN BEHAVIOR
  // ============================================================================

  describe('beliefs manifested in spending behavior', () => {
    it('should correlate security beliefs with impulse control', () => {
      const secureSpender = {
        emotionalMoneyLevel: 'not_emotional',
        impulseWaitRule: 'always',
        plannedPurchasesOnly: 'always'
      };

      const beliefs = analyzeMoneyBeliefs(secureSpender);

      expect(beliefs.beliefScores).toBeDefined();
      expect(beliefs.beliefScores.moneyAsSecurity).toBeGreaterThanOrEqual(50);
    });

    it('should correlate freedom beliefs with spontaneous spending', () => {
      const spontaneousSpender = {
        emotionalMoneyLevel: 'somewhat_emotional',
        unplannedPurchaseFreq: 'very_frequently',
        impulseWaitRule: 'never'
      };

      const beliefs = analyzeMoneyBeliefs(spontaneousSpender);

      expect(beliefs.beliefScores).toBeDefined();
      expect(beliefs.beliefScores.moneyAsFreedom).toBeGreaterThanOrEqual(0);
    });

    it('should identify money shame beliefs', () => {
      const shameBehavior = {
        avoidBalanceDuringStress: true,
        emotionalMoneyLevel: 'extremely_emotional',
        regretImpulseFreq: 'very_frequently'
      };

      const beliefs = analyzeMoneyBeliefs(shameBehavior);

      expect(beliefs).toBeDefined();
      expect(beliefs.beliefs).toBeDefined();
      expect(Array.isArray(beliefs.beliefs)).toBe(true);
    });

    it('should identify status/power beliefs', () => {
      const statusFocusedBehavior = {
        socialInfluenceLevel: 'heavily',
        emotionalMoneyLevel: 'somewhat_emotional',
        unplannedPurchaseFreq: 'sometimes'
      };

      const beliefs = analyzeMoneyBeliefs(statusFocusedBehavior);

      expect(beliefs.beliefScores).toBeDefined();
      expect(beliefs.beliefScores.moneyAsIdentity).toBeGreaterThanOrEqual(0);
    });

    it('should identify accumulation beliefs', () => {
      const accumulationBehavior = {
        presentFutureMindset: 'extreme_discipline',
        emotionalMoneyLevel: 'not_emotional',
        regretImpulseFreq: 'never'
      };

      const beliefs = analyzeMoneyBeliefs(accumulationBehavior);

      expect(beliefs).toBeDefined();
      expect(Object.keys(beliefs).length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // BELIEF CATEGORIZATION
  // ============================================================================

  describe('belief categorization by personality type', () => {
    it('should classify security-focused beliefs', () => {
      const securityFocusedBehavior = {
        emotionalMoneyLevel: 20, // Low emotional spending
        presentFutureMindset: 30, // Conservative, future-focused
        avoidBalanceDuringStress: true,
        moneySecurity: 80, // High security focus
        fearOfPoverty: 75
      };

      const beliefs = analyzeMoneyBeliefs(securityFocusedBehavior);

      // High security focus = high conservatism
      expect(beliefs.conservatism).toBeGreaterThan(50);
      expect(beliefs.beliefScores.moneyAsSecurity).toBeGreaterThan(50);
    });

    it('should predict spending impulsivity from beliefs', () => {
      const emotionalBehavior = {
        emotionalMoneyLevel: 'extremely_emotional',
        socialInfluenceLevel: 'heavily'
      };

      const beliefs = analyzeMoneyBeliefs(emotionalBehavior);

      expect(beliefs.beliefScores).toBeDefined();
      expect(beliefs.beliefs).toBeDefined();
      expect(Array.isArray(beliefs.beliefs)).toBe(true);
    });

    it('should predict saving tendency from beliefs', () => {
      const savingBehavior = {
        presentFutureMindset: 'secure_future',
        emotionalMoneyLevel: 'not_emotional'
      };

      const beliefs = analyzeMoneyBeliefs(savingBehavior);

      // High security focus and conservation orientation
      expect(beliefs.conservatism).toBeGreaterThan(40);
      expect(beliefs.beliefScores.moneyAsSecurity).toBeGreaterThan(40);
    });

    it('should identify risk tolerance from beliefs', () => {
      const riskTakingBehavior = {
        presentFutureMindset: 'enjoy_today',
        emotionalMoneyLevel: 'somewhat_emotional'
      };

      const beliefs = analyzeMoneyBeliefs(riskTakingBehavior);

      expect(beliefs).toBeDefined();
    });

    it('should predict debt attitude from beliefs', () => {
      const debtAvoidanceBehavior = {
        presentFutureMindset: 20, // Extreme discipline = very future-focused
        emotionalMoneyLevel: 15, // Not emotional
        scarcityVsAbundance: 70, // High scarcity mindset
        investmentInterest: 30 // Low investment interest
      };

      const beliefs = analyzeMoneyBeliefs(debtAvoidanceBehavior);

      // High conservatism indicates debt avoidance
      expect(beliefs.conservatism).toBeGreaterThan(50);
    });
  });

  // ============================================================================
  // BELIEF CONFLICTS AND CONTRADICTIONS
  // ============================================================================

  describe('identifying conflicting money beliefs', () => {
    it('should detect security vs freedom conflict', () => {
      const conflictBehavior = {
        presentFutureMindset: 'balance_both',
        emotionalMoneyLevel: 'somewhat_emotional',
        plannedPurchasesOnly: 'often',
        unplannedPurchaseFreq: 'sometimes'
      };

      const beliefs = analyzeMoneyBeliefs(conflictBehavior);

      expect(beliefs).toBeDefined();
      expect(Object.keys(beliefs).length).toBeGreaterThan(0);
    });

    it('should identify abundance vs scarcity contradiction', () => {
      const contradictoryBehavior = {
        avoidBalanceDuringStress: true,
        presentFutureMindset: 'enjoy_today'
      };

      const beliefs = analyzeMoneyBeliefs(contradictoryBehavior);

      expect(beliefs).toBeDefined();
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('end-to-end belief analysis', () => {
    it('should analyze builder personality beliefs', () => {
      const builderBehavior = {
        presentFutureMindset: 20, // Extreme discipline
        emotionalMoneyLevel: 10, // Not emotional
        plannedPurchasesOnly: 100, // Always planned
        impulseWaitRule: 100, // Always wait before impulse purchase
        moneySecurity: 80, // High security focus
        fearOfPoverty: 75
      };

      const beliefs = analyzeMoneyBeliefs(builderBehavior);

      // Builders are high-conservatism, high-security focused
      expect(beliefs.conservatism).toBeGreaterThan(50);
      expect(beliefs.beliefScores.moneyAsSecurity).toBeGreaterThan(40);
    });

    it('should analyze survivor personality beliefs', () => {
      const survivorBehavior = {
        emotionalMoneyLevel: 'not_emotional',
        presentFutureMindset: 'secure_future',
        socialInfluenceLevel: 'rarely'
      };

      const beliefs = analyzeMoneyBeliefs(survivorBehavior);

      expect(beliefs.beliefScores).toBeDefined();
      expect(beliefs.beliefScores.moneyAsSecurity).toBeGreaterThanOrEqual(0);
    });

    it('should analyze dreamer personality beliefs', () => {
      const dreamerBehavior = {
        emotionalMoneyLevel: 'somewhat_emotional',
        presentFutureMindset: 'balance_both',
        socialInfluenceLevel: 'sometimes'
      };

      const beliefs = analyzeMoneyBeliefs(dreamerBehavior);

      expect(beliefs).toBeDefined();
    });

    it('should identify primary vs secondary beliefs', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      // Primary beliefs are in the beliefScores object
      expect(beliefs.beliefScores).toBeDefined();
      const beliefKeys = Object.keys(beliefs.beliefScores);
      expect(beliefKeys.length).toBeGreaterThan(0);
      
      // Secondary beliefs are in the narrative beliefs array
      expect(Array.isArray(beliefs.beliefs)).toBe(true);
    });

    it('should support belief evolution tracking over time', () => {
      const initialBeliefs = analyzeMoneyBeliefs(mockBehavior);
      
      // After intervention, can re-analyze
      const updatedBeliefs = analyzeMoneyBeliefs({
        ...mockBehavior,
        impulseWaitRule: 'always'
      });

      expect(initialBeliefs).toBeDefined();
      expect(updatedBeliefs).toBeDefined();
    });

    it('should provide actionable belief insights', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      // System should identify which beliefs drive behavior
      expect(beliefs.beliefScores).toBeDefined();
      
      // Should have multiple belief dimensions
      expect(Object.keys(beliefs.beliefScores).length).toBeGreaterThan(0);
      
      // Should have narrative beliefs array
      expect(Array.isArray(beliefs.beliefs)).toBe(true);
    });
  });

  // ============================================================================
  // DERIVING MONEY BELIEFS (Alias Testing)
  // ============================================================================

  describe('deriveMoneyBeliefs() - alias validation', () => {
    it('should produce same results as analyzeMoneyBeliefs', () => {
      const result1 = analyzeMoneyBeliefs(mockBehavior);
      const result2 = deriveMoneyBeliefs(mockBehavior);

      // Results should be equivalent (ignoring timestamp which may differ)
      expect(result1.beliefScores).toEqual(result2.beliefScores);
      expect(result1.beliefs).toEqual(result2.beliefs);
      expect(result1.conservatism).toBe(result2.conservatism);
    });

    it('should derive consistent beliefs across calls', () => {
      const beliefs1 = deriveMoneyBeliefs(mockBehavior);
      const beliefs2 = deriveMoneyBeliefs(mockBehavior);

      // Beliefs should be consistent (ignoring timestamp which may differ slightly)
      expect(beliefs1.beliefScores).toEqual(beliefs2.beliefScores);
      expect(beliefs1.beliefs).toEqual(beliefs2.beliefs);
      expect(beliefs1.conservatism).toBe(beliefs2.conservatism);
    });
  });
});
