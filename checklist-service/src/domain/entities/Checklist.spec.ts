import { Checklist } from './Checklist';
import { Task } from './Task';
import { ChecklistCompleted } from '../events/ChecklistCompleted';

const makeTask = (title = 'Task A') => Task.create('task-1', title);
const makeChecklist = () => Checklist.create('cl-1', 'My Checklist');

describe('Checklist (aggregate root)', () => {
  it('creates with PENDING status and no tasks', () => {
    const cl = makeChecklist();
    expect(cl.status.isPending()).toBe(true);
    expect(cl.tasks).toHaveLength(0);
  });

  it('moves to IN_PROGRESS when one task is added and completed partially', () => {
    const cl = makeChecklist();
    cl.addTask(Task.create('t1', 'First'));
    cl.addTask(Task.create('t2', 'Second'));
    cl.completeTask('t1');
    expect(cl.status.isInProgress()).toBe(true);
    expect(cl.getCompletionPercentage().getValue()).toBe(50);
  });

  it('moves to COMPLETED and emits ChecklistCompleted when all tasks done', () => {
    const cl = makeChecklist();
    cl.addTask(Task.create('t1', 'First'));
    cl.completeTask('t1');

    expect(cl.status.isCompleted()).toBe(true);

    const events = cl.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ChecklistCompleted);
    expect((events[0] as ChecklistCompleted).checklistId).toBe('cl-1');
  });

  it('prevents completing a task twice (multi-task checklist stays IN_PROGRESS)', () => {
    const cl = makeChecklist();
    cl.addTask(Task.create('t1', 'First'));
    cl.addTask(Task.create('t2', 'Second'));
    cl.completeTask('t1');
    // checklist is IN_PROGRESS, so the guard passes — but Task itself rejects
    expect(() => cl.completeTask('t1')).toThrow('already completed');
  });

  it('prevents completing a task when checklist is already completed', () => {
    const cl = makeChecklist();
    cl.addTask(Task.create('t1', 'First'));
    cl.completeTask('t1');
    cl.pullDomainEvents();
    expect(() => cl.completeTask('t1')).toThrow('Cannot modify a completed checklist');
  });

  it('throws when adding a duplicate task', () => {
    const cl = makeChecklist();
    cl.addTask(makeTask());
    expect(() => cl.addTask(makeTask())).toThrow('already exists');
  });

  it('CompletionPercentage returns 0 when no tasks exist', () => {
    const cl = makeChecklist();
    expect(cl.getCompletionPercentage().getValue()).toBe(0);
  });
});
