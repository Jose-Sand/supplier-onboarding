import { describe, it, expect, beforeEach } from 'vitest';
import { Task } from '../../src/domain/entities/Task';

describe('Task entity', () => {
  describe('create()', () => {
    it('creates a task with completed = false by default', () => {
      const task = Task.create('t-1', 'Write docs');

      expect(task.completed).toBe(false);
      expect(task.completedAt).toBeUndefined();
    });

    it('stores id and title correctly', () => {
      const task = Task.create('t-1', '  Write docs  ');

      expect(task.id).toBe('t-1');
      expect(task.title).toBe('Write docs'); // trimmed
    });

    it('stores optional description', () => {
      const task = Task.create('t-1', 'Deploy', 'Deploy to production');

      expect(task.description).toBe('Deploy to production');
    });

    it('throws if title is empty', () => {
      expect(() => Task.create('t-1', '')).toThrow('Task title cannot be empty');
      expect(() => Task.create('t-1', '   ')).toThrow('Task title cannot be empty');
    });
  });

  describe('complete()', () => {
    let task: Task;

    beforeEach(() => {
      task = Task.create('t-1', 'Write tests');
    });

    it('sets completed to true', () => {
      task.complete();

      expect(task.completed).toBe(true);
    });

    it('sets completedAt to a valid date', () => {
      const before = new Date();
      task.complete();
      const after = new Date();

      expect(task.completedAt).toBeInstanceOf(Date);
      expect(task.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(task.completedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('throws if called a second time', () => {
      task.complete();

      expect(() => task.complete()).toThrow('already completed');
      expect(() => task.complete()).toThrow(`Task "${task.title}" is already completed`);
    });
  });

  describe('toSnapshot()', () => {
    it('returns a plain object reflecting task state', () => {
      const task = Task.create('t-1', 'A task', 'desc');
      task.complete();

      const snap = task.toSnapshot();

      expect(snap.id).toBe('t-1');
      expect(snap.title).toBe('A task');
      expect(snap.description).toBe('desc');
      expect(snap.completed).toBe(true);
      expect(snap.completedAt).toBeInstanceOf(Date);
    });
  });
});
