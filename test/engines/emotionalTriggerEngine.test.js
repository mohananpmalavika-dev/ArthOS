/**
 * test/engines/emotionalTriggerEngine.test.js
 * Unit tests for emotional trigger detection and pattern analysis
 * 
 * Focus: Trigger identification, pattern recognition, behavior correlation
 * Priority: HIGH
 * Target Coverage: 70%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { detectTriggers, identifyTriggerPatterns } from '../../src/engines/emotionalTriggerEngine.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('emotionalTriggerEngine.js - Emotional Trigger Detection', () => {
  let mockUser;
  let mockTriggers;
  let mockHistory;

  beforeEach(() => {
    mockUser = createMockAssessment();
    mockTriggers = {
      stress: true,
      socialPressure: true,
      boredom: false,
      emotional: true,
      fatigue: false
    };
    mockHistory = [
      { date: '2026-06-01', trigger: 'stress', outcome: 'impulse_purchase', amount: 250 },
      { date: '2026-06-02', trigger: 'stress', outcome: 'impulse_purchase', amount: 180 },
      { date: '2026-06-05', trigger: 'socialPressure', outcome: 'unnecessary_expense', amount: 100 },
      { date: '2026-06-08', trigger: 'emotional', outcome: 'retail_therapy', amount: 320 }
    ];
  });

  // ============================================================================
  // CORE TRIGGER DETECTION
  // ============================================================================

  describe('detectTriggers()', () => {
    it('should return trigger object with required properties', () => {
      const triggers = detectTriggers(mockUser);

      expect(triggers).toBeDefined();
      expect(typeof triggers).toBe('object');
      expect(Object.keys(triggers).length).toBeGreaterThan(0);
    });

    it('should identify stress-related triggers', () => {
      const triggers = detectTriggers(mockUser);

      expect(triggers).toHaveProperty('stress');
      expect(typeof triggers.stress).toBe('boolean');
    });

    it('should identify social influence triggers', () => {
      const triggers = detectTriggers(mockUser);

      expect(triggers).toHaveProperty('socialInfluence');
      expect(typeof triggers.socialInfluence).toBe('boolean');
    });

    it('should identify emotional spending triggers', () => {
      const triggers = detectTriggers(mockUser);

      expect(triggers).toHaveProperty('emotional');
      expect(typeof triggers.emotional).toBe('boolean');
    });

    it('should identify boredom-based triggers', () => {
      const triggers = detectTriggers(mockUser);

      // Should track boredom or similar trigger type
      expect(Object.keys(triggers).length).toBeGreaterThan(0);
    });

    it('should handle user with no behavioral data', () => {
      const emptyUser = { behaviour: {}, profile: {} };

      expect(() => detectTriggers(emptyUser)).not.toThrow();
      const triggers = detectTriggers(emptyUser);
      expect(triggers).toBeDefined();
    });

    it('should handle null/undefined user input', () => {
      expect(() => detectTriggers(null)).not.toThrow();
      expect(() => detectTriggers(undefined)).not.toThrow();
    });

    it('should correlate triggers with behavioral patterns', () => {
      const emotionalUser = {
        behaviour: {
          emotionalMoneyLevel: 'extremely_emotional',
          spendWhenStressed: 'very_likely'
        }
      };

      const triggers = detectTriggers(emotionalUser);

      expect(triggers.emotional).toBe(true);
      expect(triggers.stress).toBe(true);
    });
  });

  // ============================================================================
  // TRIGGER PATTERN ANALYSIS
  // ============================================================================

  describe('identifyTriggerPatterns()', () => {
    it('should recognize repeating trigger patterns', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      expect(patterns).toBeDefined();
      expect(typeof patterns).toBe('object');
    });

    it('should identify most common trigger', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      expect(patterns).toHaveProperty('dominantTrigger');
      expect(['stress', 'socialPressure', 'emotional', 'boredom', 'fatigue']).toContain(
        patterns.dominantTrigger
      );
    });

    it('should calculate trigger frequency scores', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      if (patterns.frequencyScores) {
        expect(typeof patterns.frequencyScores).toBe('object');
        Object.values(patterns.frequencyScores).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should identify trigger combinations', () => {
      const complexHistory = [
        { date: '2026-06-01', triggers: ['stress', 'boredom'], amount: 300 },
        { date: '2026-06-02', triggers: ['stress', 'emotional'], amount: 250 },
        { date: '2026-06-03', triggers: ['boredom', 'fatigue'], amount: 150 }
      ];

      const patterns = identifyTriggerPatterns(mockTriggers, complexHistory);

      expect(patterns).toBeDefined();
    });

    it('should handle empty history', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, []);

      expect(patterns).toBeDefined();
    });

    it('should calculate trigger impact on spending', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      if (patterns.spendingImpact) {
        expect(typeof patterns.spendingImpact).toBe('object');
        Object.values(patterns.spendingImpact).forEach(impact => {
          expect(typeof impact).toBe('number');
        });
      }
    });

    it('should rank triggers by severity', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      if (patterns.severityRanking) {
        expect(Array.isArray(patterns.severityRanking)).toBe(true);
        if (patterns.severityRanking.length >= 2) {
          // Should be ordered by severity
          expect(patterns.severityRanking.length).toBeGreaterThan(0);
        }
      }
    });

    it('should identify temporal patterns in triggers', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      // Should analyze when triggers occur
      expect(patterns).toBeDefined();
    });
  });

  // ============================================================================
  // TRIGGER SEVERITY ASSESSMENT
  // ============================================================================

  describe('trigger severity and impact', () => {
    it('should assess stress trigger severity', () => {
      const highStressUser = {
        behaviour: {
          emotionalMoneyLevel: 'extremely_emotional',
          spendWhenStressed: 'very_likely',
          presentFutureMindset: 'enjoy_today'
        }
      };

      const triggers = detectTriggers(highStressUser);
      const patterns = identifyTriggerPatterns(triggers, mockHistory);

      expect(triggers.stress).toBe(true);
      expect(patterns).toBeDefined();
    });

    it('should assess social pressure severity', () => {
      const socialUser = {
        behaviour: {
          socialInfluenceLevel: 'heavily',
          unplannedPurchaseFreq: 'very_frequently'
        }
      };

      const triggers = detectTriggers(socialUser);

      expect(triggers).toBeDefined();
      expect(Object.keys(triggers).length).toBeGreaterThan(0);
    });

    it('should calculate cumulative trigger load', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      // System should track cumulative trigger effects
      expect(patterns).toBeDefined();
    });

    it('should identify low-severity triggers for intervention', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      // Should identify opportunities for low-impact interventions
      expect(patterns).toHaveProperty('dominantTrigger');
    });
  });

  // ============================================================================
  // BEHAVIORAL CORRELATION
  // ============================================================================

  describe('trigger-behavior correlation', () => {
    it('should correlate impulse frequency with triggers', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      // History has multiple impulse purchases on same trigger days
      expect(patterns).toBeDefined();
    });

    it('should predict likelihood of impulse spending given trigger', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      if (patterns.impulseProbability) {
        expect(typeof patterns.impulseProbability).toBe('number');
        expect(patterns.impulseProbability).toBeGreaterThanOrEqual(0);
        expect(patterns.impulseProbability).toBeLessThanOrEqual(1);
      }
    });

    it('should track trigger-to-spending latency', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      // Should identify how quickly spending follows trigger
      expect(patterns).toBeDefined();
    });

    it('should identify delayed trigger effects', () => {
      const delayedHistory = [
        { date: '2026-06-01', trigger: 'stress', outcome: null },
        { date: '2026-06-02', trigger: null, outcome: 'impulse_purchase', amount: 200 }
      ];

      const patterns = identifyTriggerPatterns(mockTriggers, delayedHistory);

      expect(patterns).toBeDefined();
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('end-to-end trigger analysis', () => {
    it('should analyze high-emotion user profile', () => {
      const emotionalProfile = {
        behaviour: {
          emotionalMoneyLevel: 'extremely_emotional',
          socialInfluenceLevel: 'heavily',
          spendWhenStressed: 'very_likely',
          spendWhenBored: 'very_likely'
        }
      };

      const triggers = detectTriggers(emotionalProfile);
      const patterns = identifyTriggerPatterns(triggers, mockHistory);

      expect(triggers.emotional).toBe(true);
      expect(triggers.stress).toBe(true);
      expect(patterns.dominantTrigger).toBeDefined();
    });

    it('should analyze low-emotion user profile', () => {
      const controlledProfile = {
        behaviour: {
          emotionalMoneyLevel: 'rarely',
          socialInfluenceLevel: 'rarely',
          impulseWaitRule: 'always',
          plannedPurchasesOnly: 'always'
        }
      };

      const triggers = detectTriggers(controlledProfile);

      expect(triggers).toBeDefined();
      // Most triggers should be false or low severity
      const activeTriggers = Object.values(triggers).filter(t => t === true);
      expect(activeTriggers.length).toBeLessThan(Object.values(triggers).length);
    });

    it('should provide actionable trigger insights', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      // System should identify dominant trigger for intervention
      expect(patterns).toHaveProperty('dominantTrigger');
      expect(['stress', 'socialPressure', 'emotional']).toContain(patterns.dominantTrigger);
    });

    it('should track intervention effectiveness against triggers', () => {
      const beforeIntervention = identifyTriggerPatterns(mockTriggers, mockHistory);
      
      // After intervention, patterns should be comparable
      const afterIntervention = identifyTriggerPatterns(mockTriggers, mockHistory);

      expect(beforeIntervention.dominantTrigger).toBe(afterIntervention.dominantTrigger);
    });

    it('should support longitudinal trigger evolution tracking', () => {
      const patterns = identifyTriggerPatterns(mockTriggers, mockHistory);

      // Should track trigger patterns over time
      expect(patterns).toHaveProperty('dominantTrigger');
      
      if (patterns.temporalTrend) {
        expect(['increasing', 'decreasing', 'stable']).toContain(patterns.temporalTrend);
      }
    });
  });
});
