/**
 * test/engines/habitEngine.js - Habit Progress Evaluation
 * 
 * Focus: Habit progress and streak calculations
 * Priority: MEDIUM
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateHabitProgress } from '../../src/engines/habitEngine.js';

describe('habitEngine.js - Habit Progress Evaluation', () => {
  // ============================================================================
  // CORE HABIT EVALUATION
  // ============================================================================

  describe('evaluateHabitProgress()', () => {
    it('should return habit progress object with required fields', () => {
      const history = [
        { completed: true },
        { completed: true },
        { completed: true },
        { completed: true }
      ];

      const result = evaluateHabitProgress(history);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('milestone');
      expect(result).toHaveProperty('weeksReviewed');
    });

    it('should calculate score based on last 4 weeks', () => {
      const history = [
        { completed: true },
        { completed: true },
        { completed: false },
        { completed: true }
      ];

      const result = evaluateHabitProgress(history);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.weeksReviewed).toBe(4);
    });

    it('should set milestone to "Habit Locked" when all 4 weeks completed', () => {
      const history = [
        { completed: true },
        { completed: true },
        { completed: true },
        { completed: true }
      ];

      const result = evaluateHabitProgress(history);

      expect(result.milestone).toBe('Habit Locked');
      expect(result.score).toBe(100);
    });

    it('should set milestone to "In Progress" when not all weeks completed', () => {
      const history = [
        { completed: true },
        { completed: false },
        { completed: true },
        { completed: false }
      ];

      const result = evaluateHabitProgress(history);

      expect(result.milestone).toBe('In Progress');
      expect(result.score).toBe(50);
    });

    it('should calculate score of 75 when 3 of 4 weeks completed', () => {
      const history = [
        { completed: true },
        { completed: true },
        { completed: true },
        { completed: false }
      ];

      const result = evaluateHabitProgress(history);

      expect(result.score).toBe(75);
    });

    it('should calculate score of 25 when 1 of 4 weeks completed', () => {
      const history = [
        { completed: true },
        { completed: false },
        { completed: false },
        { completed: false }
      ];

      const result = evaluateHabitProgress(history);

      expect(result.score).toBe(25);
    });

    it('should handle empty history array', () => {
      const result = evaluateHabitProgress([]);

      expect(result).toBeDefined();
      expect(result.score).toBe(0);
      expect(result.weeksReviewed).toBe(0);
    });

    it('should handle history with fewer than 4 weeks', () => {
      const history = [
        { completed: true },
        { completed: true }
      ];

      const result = evaluateHabitProgress(history);

      expect(result).toBeDefined();
      expect(result.weeksReviewed).toBe(2);
      expect(result.score).toBe(50);
    });

    it('should handle null/undefined input gracefully', () => {
      expect(() => evaluateHabitProgress(null)).not.toThrow();
      expect(() => evaluateHabitProgress(undefined)).not.toThrow();
    });

    it('should only consider last 4 weeks for history longer than 4', () => {
      const history = [
        { completed: false },
        { completed: false },
        { completed: false },
        { completed: false },
        { completed: true },
        { completed: true },
        { completed: true },
        { completed: true }
      ];

      const result = evaluateHabitProgress(history);

      // Should only count the last 4: all completed
      expect(result.score).toBe(100);
      expect(result.milestone).toBe('Habit Locked');
    });
  });
});
