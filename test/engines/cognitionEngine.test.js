/**
 * test/engines/cognitionEngine.test.js
 * Unit tests for Bayesian belief updates, calibration, and cognition profiling
 * 
 * Focus: Belief updates, calibration tracking, multi-dimensional drift detection
 * Priority: HIGH
 * Target Coverage: 75%+
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  bayesianBeliefUpdate,
  credibleInterval,
  detectBeliefDrift,
  detectMultiDimensionDrift,
  buildCognitionProfile,
  analyzeMoneyBeliefs,
  calibrateRiskPerception,
  generateRiskScore
} from '../../src/engines/cognitionEngine.js';
import { createMockAssessment } from '../fixtures/factories.js';

describe('cognitionEngine.js - Belief Updates & Calibration', () => {
  let mockUser;
  let mockBeliefHistory;
  let mockResponses;

  beforeEach(() => {
    mockUser = createMockAssessment();
    mockBeliefHistory = [
      { date: '2026-05-01', score: 45, dimension: 'financial_control' },
      { date: '2026-05-15', score: 52, dimension: 'financial_control' },
      { date: '2026-06-01', score: 48, dimension: 'financial_control' }
    ];
    mockResponses = {
      belief_income_reliable: 'strongly_agree',
      belief_debt_manageable: 'agree',
      belief_money_stressful: 'disagree'
    };
  });

  // ============================================================================
  // BAYESIAN BELIEF UPDATES
  // ============================================================================

  describe('bayesianBeliefUpdate()', () => {
    it('should update prior belief based on evidence', () => {
      const prior = 0.5;
      const evidence = 0.8;
      const updated = bayesianBeliefUpdate(prior, evidence, 3, 1);

      expect(updated).toBeDefined();
      expect(typeof updated).toBe('number');
      expect(updated).toBeGreaterThan(prior);
      expect(updated).toBeLessThanOrEqual(1);
    });

    it('should weight evidence according to sampleSize', () => {
      const prior = 0.5;
      const evidence = 0.8;
      const lightWeighting = bayesianBeliefUpdate(prior, evidence, 1, 1);
      const heavyWeighting = bayesianBeliefUpdate(prior, evidence, 10, 1);

      expect(heavyWeighting).toBeGreaterThan(lightWeighting);
    });

    it('should handle extreme prior values', () => {
      expect(bayesianBeliefUpdate(0, 0.5)).toBeDefined();
      expect(bayesianBeliefUpdate(1, 0.5)).toBeDefined();
    });
  });

  // ============================================================================
  // CREDIBLE INTERVALS
  // ============================================================================

  describe('credibleInterval()', () => {
    it('should calculate credible interval bounds', () => {
      const interval = credibleInterval(50, 100);

      expect(interval).toBeDefined();
      expect(interval.lower).toBeDefined();
      expect(interval.upper).toBeDefined();
      expect(interval.lower).toBeLessThan(interval.upper);
    });

    it('should narrow interval with larger sample size', () => {
      const smallSample = credibleInterval(50, 10);
      const largeSample = credibleInterval(50, 100);

      expect(largeSample.upper - largeSample.lower)
        .toBeLessThan(smallSample.upper - smallSample.lower);
    });
  });

  // ============================================================================
  // BELIEF DRIFT DETECTION
  // ============================================================================

  describe('detectBeliefDrift()', () => {
    it('should detect drift when beliefs change significantly', () => {
      const history = [45, 48, 52, 58, 65];
      const currentScore = 65;
      const drift = detectBeliefDrift(history, currentScore);

      expect(drift).toBeDefined();
      expect(drift.drifted).toBe(true);
    });

    it('should not flag stable beliefs as drift', () => {
      const history = [50, 51, 49, 50, 51];
      const currentScore = 50;
      const drift = detectBeliefDrift(history, currentScore);

      expect(drift.drifted).toBe(false);
    });

    it('should provide drift direction', () => {
      const history = [30, 35, 40];
      const drift = detectBeliefDrift(history, 45);

      expect(drift.direction).toMatch(/upward|downward/);
    });
  });

  // ============================================================================
  // MULTI-DIMENSIONAL DRIFT
  // ============================================================================

  describe('detectMultiDimensionDrift()', () => {
    it('should detect drift across multiple belief dimensions', () => {
      const beliefHistoryMap = {
        financial_control: [40, 42, 45],
        debt_confidence: [30, 32, 35],
        income_stability: [50, 52, 51]
      };
      const currentScores = {
        financial_control: 48,
        debt_confidence: 40,
        income_stability: 50
      };

      const driftMap = detectMultiDimensionDrift(beliefHistoryMap, currentScores);

      expect(driftMap).toBeDefined();
      expect(driftMap.financial_control).toBeDefined();
      expect(driftMap.debt_confidence).toBeDefined();
    });

    it('should identify dimensions with strongest drift', () => {
      const beliefHistoryMap = {
        dimension_a: [10, 11, 12],
        dimension_b: [50, 60, 70]
      };
      const currentScores = {
        dimension_a: 13,
        dimension_b: 85
      };

      const driftMap = detectMultiDimensionDrift(beliefHistoryMap, currentScores);

      expect(Object.keys(driftMap).length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // COGNITION PROFILE BUILDING
  // ============================================================================

  describe('buildCognitionProfile()', () => {
    it('should build comprehensive cognition profile', () => {
      const profile = buildCognitionProfile(mockUser);

      expect(profile).toBeDefined();
      expect(profile.beliefs).toBeDefined();
      expect(profile.calibration).toBeDefined();
      expect(profile.riskPerception).toBeDefined();
    });

    it('should identify money belief dimensions', () => {
      const profile = buildCognitionProfile(mockUser);

      expect(profile.beliefs.moneyBeliefs).toBeDefined();
      expect(Array.isArray(profile.beliefs.moneyBeliefs)).toBe(true);
    });

    it('should calculate calibration accuracy', () => {
      const profile = buildCognitionProfile(mockUser);

      expect(profile.calibration.accuracy).toBeGreaterThanOrEqual(0);
      expect(profile.calibration.accuracy).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // MONEY BELIEFS ANALYSIS
  // ============================================================================

  describe('analyzeMoneyBeliefs()', () => {
    it('should analyze responses to money belief questions', () => {
      const beliefs = analyzeMoneyBeliefs(mockResponses);

      expect(beliefs).toBeDefined();
      expect(beliefs.patterns).toBeDefined();
    });

    it('should identify belief extremes', () => {
      const responses = {
        money_question_1: 'strongly_agree',
        money_question_2: 'strongly_disagree',
        money_question_3: 'disagree'
      };
      const beliefs = analyzeMoneyBeliefs(responses);

      expect(beliefs.extremism).toBeDefined();
    });
  });

  // ============================================================================
  // RISK PERCEPTION CALIBRATION
  // ============================================================================

  describe('calibrateRiskPerception()', () => {
    it('should calibrate risk perception against history', () => {
      const userProfile = { riskTolerance: 5 };
      const behaviourHistory = [
        { risk: 3, outcome: 'loss' },
        { risk: 7, outcome: 'gain' },
        { risk: 2, outcome: 'neutral' }
      ];

      const calibration = calibrateRiskPerception(userProfile, behaviourHistory);

      expect(calibration).toBeDefined();
      expect(calibration.adjustedRiskTolerance).toBeDefined();
    });
  });

  // ============================================================================
  // RISK SCORING
  // ============================================================================

  describe('generateRiskScore()', () => {
    it('should generate numerical risk score', () => {
      const score = generateRiskScore(mockUser);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should reflect high-risk profile characteristics', () => {
      const highRiskUser = {
        ...mockUser,
        income: 'highly_variable',
        debt: 'significant',
        emergency_savings: 'none'
      };
      const highRiskScore = generateRiskScore(highRiskUser);

      const lowRiskUser = {
        ...mockUser,
        income: 'very_consistent',
        debt: 'none',
        emergency_savings: '12_plus_months'
      };
      const lowRiskScore = generateRiskScore(lowRiskUser);

      expect(highRiskScore).toBeGreaterThan(lowRiskScore);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration: Full Cognition Workflow', () => {
    it('should track belief evolution through updates and drift detection', () => {
      let belief = 0.4;
      const evidence1 = 0.6;
      belief = bayesianBeliefUpdate(belief, evidence1);

      const evidence2 = 0.7;
      belief = bayesianBeliefUpdate(belief, evidence2);

      expect(belief).toBeGreaterThan(0.4);
    });

    it('should build and validate cognition profile', () => {
      const profile = buildCognitionProfile(mockUser);
      expect(profile.beliefs).toBeDefined();
      expect(profile.calibration).toBeDefined();
      expect(profile.riskPerception).toBeDefined();
    });
  });
});
