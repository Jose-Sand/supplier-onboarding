import { describe, it, expect } from 'vitest';
import { CompletionPercentage } from '../../src/domain/value-objects/CompletionPercentage';

describe('CompletionPercentage value object', () => {
  describe('of(completed, total)', () => {
    it('returns 0 when total is 0 (no tasks)', () => {
      const pct = CompletionPercentage.of(0, 0);

      expect(pct.getValue()).toBe(0);
      expect(pct.isComplete()).toBe(false);
    });

    it('returns 0 when no tasks are completed', () => {
      expect(CompletionPercentage.of(0, 5).getValue()).toBe(0);
    });

    it('calculates 25% correctly', () => {
      expect(CompletionPercentage.of(1, 4).getValue()).toBe(25);
    });

    it('calculates 50% correctly', () => {
      expect(CompletionPercentage.of(1, 2).getValue()).toBe(50);
    });

    it('rounds to 2 decimal places', () => {
      // 1/3 = 33.333... → rounds to 33.33
      expect(CompletionPercentage.of(1, 3).getValue()).toBe(33.33);
      // 2/3 = 66.666... → rounds to 66.67
      expect(CompletionPercentage.of(2, 3).getValue()).toBe(66.67);
    });

    it('returns 100 when all tasks are completed', () => {
      const pct = CompletionPercentage.of(5, 5);

      expect(pct.getValue()).toBe(100);
      expect(pct.isComplete()).toBe(true);
    });
  });

  describe('fromValue()', () => {
    it('creates a valid instance from a number', () => {
      expect(CompletionPercentage.fromValue(75).getValue()).toBe(75);
    });

    it('accepts boundary values 0 and 100', () => {
      expect(() => CompletionPercentage.fromValue(0)).not.toThrow();
      expect(() => CompletionPercentage.fromValue(100)).not.toThrow();
    });

    it('throws if value is below 0', () => {
      expect(() => CompletionPercentage.fromValue(-1)).toThrow(
        'CompletionPercentage must be between 0 and 100',
      );
    });

    it('throws if value exceeds 100', () => {
      expect(() => CompletionPercentage.fromValue(101)).toThrow(
        'CompletionPercentage must be between 0 and 100',
      );
    });
  });

  describe('isComplete()', () => {
    it('returns true only at exactly 100', () => {
      expect(CompletionPercentage.fromValue(99.99).isComplete()).toBe(false);
      expect(CompletionPercentage.fromValue(100).isComplete()).toBe(true);
    });
  });

  describe('equals()', () => {
    it('returns true when values are identical', () => {
      expect(
        CompletionPercentage.fromValue(50).equals(CompletionPercentage.fromValue(50)),
      ).toBe(true);
    });

    it('returns false when values differ', () => {
      expect(
        CompletionPercentage.fromValue(50).equals(CompletionPercentage.fromValue(75)),
      ).toBe(false);
    });
  });

  describe('toString()', () => {
    it('formats as "value%"', () => {
      expect(CompletionPercentage.fromValue(0).toString()).toBe('0%');
      expect(CompletionPercentage.fromValue(75).toString()).toBe('75%');
      expect(CompletionPercentage.fromValue(100).toString()).toBe('100%');
    });
  });
});
