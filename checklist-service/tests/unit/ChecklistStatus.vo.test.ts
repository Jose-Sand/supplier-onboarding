import { describe, it, expect } from 'vitest';
import { ChecklistStatus } from '../../src/domain/value-objects/ChecklistStatus';

describe('ChecklistStatus value object', () => {
  describe('factory methods', () => {
    it('creates PENDING status correctly', () => {
      const status = ChecklistStatus.pending();

      expect(status.isPending()).toBe(true);
      expect(status.isInProgress()).toBe(false);
      expect(status.isCompleted()).toBe(false);
      expect(status.toString()).toBe('PENDING');
    });

    it('creates IN_PROGRESS status correctly', () => {
      const status = ChecklistStatus.inProgress();

      expect(status.isInProgress()).toBe(true);
      expect(status.isPending()).toBe(false);
      expect(status.isCompleted()).toBe(false);
      expect(status.toString()).toBe('IN_PROGRESS');
    });

    it('creates COMPLETED status correctly', () => {
      const status = ChecklistStatus.completed();

      expect(status.isCompleted()).toBe(true);
      expect(status.isPending()).toBe(false);
      expect(status.isInProgress()).toBe(false);
      expect(status.toString()).toBe('COMPLETED');
    });
  });

  describe('fromString()', () => {
    it('parses valid uppercase strings', () => {
      expect(ChecklistStatus.fromString('PENDING').isPending()).toBe(true);
      expect(ChecklistStatus.fromString('IN_PROGRESS').isInProgress()).toBe(true);
      expect(ChecklistStatus.fromString('COMPLETED').isCompleted()).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(ChecklistStatus.fromString('pending').isPending()).toBe(true);
      expect(ChecklistStatus.fromString('in_progress').isInProgress()).toBe(true);
      expect(ChecklistStatus.fromString('completed').isCompleted()).toBe(true);
    });

    it('throws with an invalid value', () => {
      expect(() => ChecklistStatus.fromString('UNKNOWN')).toThrow(
        'Invalid checklist status: UNKNOWN',
      );
      expect(() => ChecklistStatus.fromString('')).toThrow('Invalid checklist status');
      expect(() => ChecklistStatus.fromString('done')).toThrow('Invalid checklist status');
    });
  });

  describe('equals()', () => {
    it('returns true when both statuses are the same', () => {
      expect(ChecklistStatus.pending().equals(ChecklistStatus.pending())).toBe(true);
      expect(ChecklistStatus.inProgress().equals(ChecklistStatus.inProgress())).toBe(true);
      expect(ChecklistStatus.completed().equals(ChecklistStatus.completed())).toBe(true);
    });

    it('returns false when statuses differ', () => {
      expect(ChecklistStatus.pending().equals(ChecklistStatus.completed())).toBe(false);
      expect(ChecklistStatus.inProgress().equals(ChecklistStatus.pending())).toBe(false);
      expect(ChecklistStatus.completed().equals(ChecklistStatus.inProgress())).toBe(false);
    });
  });
});
