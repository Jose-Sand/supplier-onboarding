import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateChecklist } from '../../src/application/use-cases/CreateChecklist';
import { IChecklistRepository } from '../../src/domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../src/domain/ports/IEventPublisher';
import { Checklist } from '../../src/domain/entities/Checklist';

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

describe('CreateChecklist use case', () => {
  let repository: IChecklistRepository;
  let eventPublisher: IEventPublisher;
  let useCase: CreateChecklist;

  beforeEach(() => {
    repository = makeRepository();
    eventPublisher = makeEventPublisher();
    useCase = new CreateChecklist(repository, eventPublisher);
  });

  describe('successful creation', () => {
    it('saves the checklist and returns a generated id', async () => {
      const output = await useCase.execute({ title: 'Sprint Review' });

      expect(repository.save).toHaveBeenCalledOnce();
      expect(output.id).toBeDefined();
      expect(typeof output.id).toBe('string');
    });

    it('returns the correct title and PENDING status', async () => {
      const output = await useCase.execute({ title: 'Onboarding' });

      expect(output.title).toBe('Onboarding');
      expect(output.status).toBe('PENDING');
    });

    it('returns taskCount = 0 when no tasks are provided', async () => {
      const output = await useCase.execute({ title: 'Empty checklist' });

      expect(output.taskCount).toBe(0);
    });

    it('creates checklist with tasks and returns correct taskCount', async () => {
      const output = await useCase.execute({
        title: 'Release',
        tasks: [
          { title: 'Run tests' },
          { title: 'Build docker image' },
          { title: 'Deploy to staging' },
        ],
      });

      expect(output.taskCount).toBe(3);
    });

    it('passes the checklist aggregate to repository.save', async () => {
      await useCase.execute({ title: 'Audit', tasks: [{ title: 'Check logs' }] });

      const savedChecklist = vi.mocked(repository.save).mock.calls[0][0];
      expect(savedChecklist).toBeInstanceOf(Checklist);
      expect(savedChecklist.title).toBe('Audit');
      expect(savedChecklist.tasks).toHaveLength(1);
    });

    it('includes createdAt in the output', async () => {
      const before = new Date();
      const output = await useCase.execute({ title: 'Timed checklist' });
      const after = new Date();

      expect(output.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(output.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('event publishing', () => {
    it('calls publishAll with an empty array — no events on fresh checklists', async () => {
      await useCase.execute({ title: 'No events here' });

      expect(eventPublisher.publishAll).toHaveBeenCalledOnce();
      expect(eventPublisher.publishAll).toHaveBeenCalledWith([]);
    });

    it('calls publishAll even when tasks are provided (no completion yet)', async () => {
      await useCase.execute({
        title: 'With tasks',
        tasks: [{ title: 'Step 1' }, { title: 'Step 2' }],
      });

      expect(eventPublisher.publishAll).toHaveBeenCalledWith([]);
    });
  });

  describe('validation', () => {
    it('throws when title is empty', async () => {
      await expect(useCase.execute({ title: '' })).rejects.toThrow(
        'title cannot be empty',
      );
    });

    it('throws when title is only whitespace', async () => {
      await expect(useCase.execute({ title: '   ' })).rejects.toThrow(
        'title cannot be empty',
      );
    });

    it('does NOT call repository.save when title is invalid', async () => {
      await useCase.execute({ title: 'valid' }).catch(() => {});
      // only count failures
      await useCase.execute({ title: '' }).catch(() => {});

      expect(repository.save).toHaveBeenCalledOnce(); // only the valid call
    });
  });
});
