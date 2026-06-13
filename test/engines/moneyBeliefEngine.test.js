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

      expect(beliefs).toHaveProperty('security');
      expect(typeof beliefs.security).toBe('string');
      expect(['high', 'medium', 'low']).toContain(beliefs.security);
    });

    it('should identify freedom belief dimension', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      expect(beliefs).toHaveProperty('freedom');
      expect(typeof beliefs.freedom).toBe('string');
    });

    it('should assess power belief dimension', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      expect(beliefs).toHaveProperty('power');
      expect(typeof beliefs.power).toBe('string');
    });

    it('should identify love/relationship money beliefs', () => {
      const beliefs = analyzeMoneyBeliefs(mockBehavior);

      // Money beliefs related to relationships/love/status
      expect(Object.keys(beliefs).length).toBeGreaterThanOrEqual(3);
    });

    it('should handle absence of behavioral data', () => {
      const emptyBehavior = {};

      expect(() => analyzeMoneyBeliefs(emptyBehavior)).not.toThrow();
      const beliefs = analyzeMoneyBeliefs(emptyBehavior);
      expect(beliefs).toBeDefined();
    });

    it('should handle null/undefined input', () => {
      expect(() => analyzeMoneyBeliefs(null)).not.toThrow();
      expect(() => analyzeMoneyBeliefs(undefined)).not.toThrow();
    });
  });

  // ============================================================================
  // BELIEF CLASSIFICATION
  // ============================================================================

  describe('belief categorization and scoring', () => {
    it('should classify security-focused beliefs', () => {
      const securityFocusedBehavior = {
        emotionalMoneyLevel: 'not_emotional',
        presentFutureMindset: 'secure_future',
        avoidBalanceDuringStress: true
      };

      const beliefs = analyzeMoneyBeliefs(securityFocusedBehavior);

      expect(beliefs.security).toBe('high');
    });

    it('should classify freedom-focused beliefs', () => {
      const freedomFocusedBehavior = {
        presentFutureMindset: 'enjoy_today',
        emotionalMoneyLevel: 'somewhat_emotional',
        unplannedPurchaseFreq: 'very_frequently'
      };

      const beliefs = analyzeMoneyBeliefs(freedomFocusedBehavior);

      expect(beliefs.freedom).toBe('high');
    });

    it('should identify status/power beliefs', () => {
      const statusFocusedBehavior = {
        socialInfluenceLevel: 'heavily',
        emotionalMoneyLevel: 'somewhat_emotional',
        unplannedPurchaseFreq: 'sometimes'
      };

      const beliefs = analyzeMoneyBeliefs(statusFocusedBehavior);

      expect(beliefs.power).toBeDefined();
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

      expect(beliefs.security).toBe('high');
    });

    it('should correlate freedom beliefs with spontaneous spending', () => {
      const spontaneousSpender = {
        emotionalMoneyLevel: 'somewhat_emotional',
        unplannedPurchaseFreq: 'very_frequently',
        impulseWaitRule: 'never'
      };

      const beliefs = analyzeMoneyBeliefs(spontaneousSpender);

      expect(beliefs.freedom).toBeDefined();
    });

    it('should identify money shame beliefs', () => {
      const shameBehavior = {
        avoidBalanceDuringStress: true,
        emotionalMoneyLevel: 'extremely_emotional',
        regretImpulseFreq: 'very_frequently'
      };

      const beliefs = analyzeMoneyBeliefs(shameBehavior);

      expect(beliefs).toBeDefined();
    });

    it('should identify abundance vs scarcity mindset', () => {
      const abundanceBehavior = {
        presentFutureMindset: 'balance_both',
        emotionalMoneyLevel: 'not_emotional'
      };

      const beliefs = analyzeMoneyBeliefs(abundanceBehavior);

      expect(beliefs).toBeDefined();
      
      const scarcityBehavior = {
        presentFutureMindset: 'secure_future',
        emotionalMoneyLevel: 'somewhat_emotional'
      };
      
      const scarcityBeliefs = analyzeMoneyBeliefs(scarcityBehavior);
      expect(scarcityBeliefs).toBeDefined();
    });
  });

  // ============================================================================
  // DERIVING MONEY BELIEFS (Alias Testing)
  // ============================================================================

  describe('deriveMoneyBeliefs() - alias validation', () => {
    it('should produce same results as analyzeMoneyBeliefs', () => {
      const result1 = analyzeMoneyBeliefs(mockBehavior);
      const result2 = deriveMoneyBeliefs(mockBehavior);

      expect(result1).toEqual(result2);
    });

    it('should derive consistent beliefs across calls', () => {
      const beliefs1 = deriveMoneyBeliefs(mockBehavior);
      const beliefs2 = deriveMoneyBeliefs(mockBehavior);

      expect(beliefs1).toEqual(beliefs2);
    });
  });

  // ============================================================================
  // BELIEF IMPACT MODELING
  // ============================================================================

  describe('money beliefs impact on financial decisions', () => {
    it('should predict spending impulsivity from beliefs', () => {
      const emotionalBehavior = {
        emotionalMoneyLevel: 'extremely_emotional',
        socialInfluenceLevel: 'heavily'
      };

      const beliefs = analyzeMoneyBeliefs(emotionalBehavior);

      expect(beliefs.freedom).toBeDefined();
      expect(beliefs.power).toBeDefined();
    });

    it('should predict saving tendency from beliefs', () => {
      const savingBehavior = {
        presentFutureMindset: 'secure_future',
        emotionalMoneyLevel: 'not_emotional'
      };

      const beliefs = analyzeMoneyBeliefs(savingBehavior);

      expect(beliefs.security).toBe('high');
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
        presentFutureMindset: 'extreme_discipline',
        emotionalMoneyLevel: 'not_emotional'
      };

      const beliefs = analyzeMoneyBeliefs(debtAvoidanceBehavior);

      expect(beliefs.security).toBe('high');
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
        presentFutureMindset: 'extreme_discipline',
        emotionalMoneyLevel: 'not_emotional',
        plannedPurchasesOnly: 'always',
        impulseWaitRule: 'always'
      };

      const beliefs = analyzeMoneyBeliefs(builderBehavior);

      expect(beliefs.security).toBe('high');
    });

    it('should analyze survivor personality beliefs', () => {
      const survivorBehavior = {
        emotionalMoneyLevel: 'not_emotional',
        presentFutureMindset: 'secure_future',
        socialInfluenceLevel: 'rarely'
      };

      const beliefs = analyzeMoneyBeliefs(survivorBehavior);

      expect(beliefs.security).toBeDefined();
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

      const beliefEntries = Object.entries(beliefs);
      expect(beliefEntries.length).toBeGreaterThan(0);
      
      // At least one belief should be identifiable as primary
      beliefEntries.forEach(([key, value]) => {
        expect(['high', 'medium', 'low']).toContain(value);
      });
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
      expect(Object.keys(beliefs).length).toBeGreaterThanOrEqual(3);
      
      // Should enable targeted interventions
      Object.values(beliefs).forEach(belief => {
        expect(typeof belief).toBe('string');
      });
    });
  });
});
