import { describe, it, expect } from 'vitest';
import { Checklist } from '../../src/domain/entities/Checklist';
import { Task } from '../../src/domain/entities/Task';
import { ChecklistCompleted } from '../../src/domain/events/ChecklistCompleted';

const makeChecklist = (id = 'cl-1', title = 'My Checklist') =>
  Checklist.create(id, title);

const makeTask = (id: string, title = `Task ${id}`) => Task.create(id, title);

describe('Checklist entity', () => {
  describe('create()', () => {
    it('initializes with PENDING status', () => {
      const cl = makeChecklist();
      expect(cl.status.isPending()).toBe(true);
      expect(cl.status.toString()).toBe('PENDING');
    });

    it('initializes with no tasks', () => {
      expect(makeChecklist().tasks).toHaveLength(0);
    });

    it('throws if title is empty', () => {
      expect(() => Checklist.create('id', '')).toThrow('title cannot be empty');
      expect(() => Checklist.create('id', '   ')).toThrow('title cannot be empty');
    });
  });

  describe('status transitions', () => {
    it('changes to IN_PROGRESS when first of several tasks is completed', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));
      cl.addTask(makeTask('t2'));

      cl.completeTask('t1');

      expect(cl.status.isInProgress()).toBe(true);
    });

    it('changes to COMPLETED when all tasks are done', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));
      cl.addTask(makeTask('t2'));

      cl.completeTask('t1');
      cl.completeTask('t2');

      expect(cl.status.isCompleted()).toBe(true);
    });

    it('goes directly from PENDING to COMPLETED with a single task', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));

      cl.completeTask('t1');

      expect(cl.status.isCompleted()).toBe(true);
    });
  });

  describe('domain events', () => {
    it('emits ChecklistCompleted when all tasks are done', () => {
      const cl = makeChecklist('cl-42', 'Release checklist');
      cl.addTask(makeTask('t1'));

      cl.completeTask('t1');
      const events = cl.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ChecklistCompleted);

      const event = events[0] as ChecklistCompleted;
      expect(event.checklistId).toBe('cl-42');
      expect(event.checklistTitle).toBe('Release checklist');
      expect(event.totalTasks).toBe(1);
      expect(event.eventName).toBe('checklist.completed');
    });

    it('does NOT emit ChecklistCompleted when tasks remain pending', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));
      cl.addTask(makeTask('t2'));

      cl.completeTask('t1');
      const events = cl.pullDomainEvents();

      expect(events).toHaveLength(0);
    });

    it('pullDomainEvents clears the queue on each call', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));
      cl.completeTask('t1');

      cl.pullDomainEvents(); // first drain
      expect(cl.pullDomainEvents()).toHaveLength(0); // queue is empty
    });
  });

  describe('completeTask() errors', () => {
    it('throws if task id does not exist', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));

      expect(() => cl.completeTask('nonexistent')).toThrow('"nonexistent" not found');
    });

    it('throws if checklist is already completed', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));
      cl.completeTask('t1');
      cl.pullDomainEvents();

      expect(() => cl.completeTask('t1')).toThrow(
        'Cannot modify a completed checklist',
      );
    });
  });

  describe('addTask()', () => {
    it('throws when adding a task with a duplicate id', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));

      expect(() => cl.addTask(makeTask('t1'))).toThrow('already exists');
    });
  });

  describe('getCompletionPercentage()', () => {
    it('returns 0% with no tasks', () => {
      expect(makeChecklist().getCompletionPercentage().getValue()).toBe(0);
    });

    it('returns 50% with half tasks completed', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));
      cl.addTask(makeTask('t2'));
      cl.completeTask('t1');

      expect(cl.getCompletionPercentage().getValue()).toBe(50);
    });

    it('returns 100% when all tasks are done', () => {
      const cl = makeChecklist();
      cl.addTask(makeTask('t1'));
      cl.completeTask('t1');

      expect(cl.getCompletionPercentage().getValue()).toBe(100);
    });
  });
});
