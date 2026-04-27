import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompleteTask } from '../../src/application/use-cases/CompleteTask';
import { Checklist } from '../../src/domain/entities/Checklist';
import { Task } from '../../src/domain/entities/Task';
import { IChecklistRepository } from '../../src/domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../src/domain/ports/IEventPublisher';
import { ChecklistCompleted } from '../../src/domain/events/ChecklistCompleted';

function makeRepository(): IChecklistRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeEventPublisher(): IEventPublisher {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    publishAll: vi.fn().mockResolvedValue(undefined),
  };
}

function makeChecklistWithTasks(...taskTitles: string[]): Checklist {
  const cl = Checklist.create('cl-1', 'Test Checklist');
  taskTitles.forEach((title, i) => cl.addTask(Task.create(`task-${i + 1}`, title)));
  return cl;
}

describe('CompleteTask use case', () => {
  let repository: IChecklistRepository;
  let eventPublisher: IEventPublisher;
  let useCase: CompleteTask;

  beforeEach(() => {
    repository = makeRepository();
    eventPublisher = makeEventPublisher();
    useCase = new CompleteTask(repository, eventPublisher);
  });

  describe('error cases', () => {
    it('throws if the checklist does not exist', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        useCase.execute({ checklistId: 'cl-missing', taskId: 'any-task' }),
      ).rejects.toThrow('"cl-missing" not found');
    });

    it('throws if the task does not belong to the checklist', async () => {
      const cl = makeChecklistWithTasks('Step 1');
      vi.mocked(repository.findById).mockResolvedValue(cl);

      await expect(
        useCase.execute({ checklistId: 'cl-1', taskId: 'no-such-task' }),
      ).rejects.toThrow('not found');
    });
  });

  describe('completing the last task', () => {
    it('returns COMPLETED status and 100% when last task is done', async () => {
      const cl = makeChecklistWithTasks('Only task');
      vi.mocked(repository.findById).mockResolvedValue(cl);

      const output = await useCase.execute({ checklistId: 'cl-1', taskId: 'task-1' });

      expect(output.checklistStatus).toBe('COMPLETED');
      expect(output.completionPercentage).toBe(100);
    });

    it('saves the updated checklist', async () => {
      const cl = makeChecklistWithTasks('Only task');
      vi.mocked(repository.findById).mockResolvedValue(cl);

      await useCase.execute({ checklistId: 'cl-1', taskId: 'task-1' });

      expect(repository.save).toHaveBeenCalledOnce();
      const saved = vi.mocked(repository.save).mock.calls[0][0];
      expect(saved.status.isCompleted()).toBe(true);
    });

    it('publishes ChecklistCompleted event', async () => {
      const cl = makeChecklistWithTasks('Deploy');
      vi.mocked(repository.findById).mockResolvedValue(cl);

      await useCase.execute({ checklistId: 'cl-1', taskId: 'task-1' });

      expect(eventPublisher.publishAll).toHaveBeenCalledOnce();
      const publishedEvents = vi.mocked(eventPublisher.publishAll).mock.calls[0][0];
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]).toBeInstanceOf(ChecklistCompleted);

      const event = publishedEvents[0] as ChecklistCompleted;
      expect(event.checklistId).toBe('cl-1');
      expect(event.totalTasks).toBe(1);
    });
  });

  describe('completing a non-last task', () => {
    it('returns IN_PROGRESS status when tasks remain', async () => {
      const cl = makeChecklistWithTasks('Step 1', 'Step 2');
      vi.mocked(repository.findById).mockResolvedValue(cl);

      const output = await useCase.execute({ checklistId: 'cl-1', taskId: 'task-1' });

      expect(output.checklistStatus).toBe('IN_PROGRESS');
      expect(output.completionPercentage).toBe(50);
    });

    it('publishes an empty events array when checklist is not yet complete', async () => {
      const cl = makeChecklistWithTasks('Step 1', 'Step 2');
      vi.mocked(repository.findById).mockResolvedValue(cl);

      await useCase.execute({ checklistId: 'cl-1', taskId: 'task-1' });

      expect(eventPublisher.publishAll).toHaveBeenCalledWith([]);
    });

    it('returns the correct checklistId and taskId in the output', async () => {
      const cl = makeChecklistWithTasks('Step 1', 'Step 2');
      vi.mocked(repository.findById).mockResolvedValue(cl);

      const output = await useCase.execute({ checklistId: 'cl-1', taskId: 'task-1' });

      expect(output.checklistId).toBe('cl-1');
      expect(output.taskId).toBe('task-1');
    });
  });
});
