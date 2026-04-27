import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetChecklistProgress } from '../../src/application/use-cases/GetChecklistProgress';
import { Checklist } from '../../src/domain/entities/Checklist';
import { Task } from '../../src/domain/entities/Task';
import { IChecklistRepository } from '../../src/domain/ports/IChecklistRepository';

function makeRepository(): IChecklistRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeChecklistWithTasks(...taskTitles: string[]): Checklist {
  const cl = Checklist.create('cl-1', 'Progress Test');
  taskTitles.forEach((title, i) => cl.addTask(Task.create(`task-${i + 1}`, title)));
  return cl;
}

describe('GetChecklistProgress use case', () => {
  let repository: IChecklistRepository;
  let useCase: GetChecklistProgress;

  beforeEach(() => {
    repository = makeRepository();
    useCase = new GetChecklistProgress(repository);
  });

  it('throws if the checklist does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ checklistId: 'cl-missing' }),
    ).rejects.toThrow('"cl-missing" not found');
  });

  it('returns correct progress for an empty checklist', async () => {
    const cl = Checklist.create('cl-1', 'Empty');
    vi.mocked(repository.findById).mockResolvedValue(cl);

    const output = await useCase.execute({ checklistId: 'cl-1' });

    expect(output.id).toBe('cl-1');
    expect(output.title).toBe('Empty');
    expect(output.status).toBe('PENDING');
    expect(output.completionPercentage).toBe(0);
    expect(output.totalTasks).toBe(0);
    expect(output.completedTasks).toBe(0);
    expect(output.pendingTasks).toBe(0);
    expect(output.tasks).toHaveLength(0);
  });

  it('returns correct progress when tasks are partially completed', async () => {
    const cl = makeChecklistWithTasks('Step 1', 'Step 2', 'Step 3', 'Step 4');
    cl.completeTask('task-1');
    cl.completeTask('task-2');
    cl.pullDomainEvents();
    vi.mocked(repository.findById).mockResolvedValue(cl);

    const output = await useCase.execute({ checklistId: 'cl-1' });

    expect(output.status).toBe('IN_PROGRESS');
    expect(output.completionPercentage).toBe(50);
    expect(output.completedTasks).toBe(2);
    expect(output.pendingTasks).toBe(2);
    expect(output.totalTasks).toBe(4);
  });

  it('returns COMPLETED status when all tasks are done', async () => {
    const cl = makeChecklistWithTasks('Only task');
    cl.completeTask('task-1');
    cl.pullDomainEvents();
    vi.mocked(repository.findById).mockResolvedValue(cl);

    const output = await useCase.execute({ checklistId: 'cl-1' });

    expect(output.status).toBe('COMPLETED');
    expect(output.completionPercentage).toBe(100);
    expect(output.completedTasks).toBe(1);
    expect(output.pendingTasks).toBe(0);
  });

  it('includes task details in the response', async () => {
    const cl = makeChecklistWithTasks('Deploy', 'Smoke test');
    cl.completeTask('task-1');
    cl.pullDomainEvents();
    vi.mocked(repository.findById).mockResolvedValue(cl);

    const output = await useCase.execute({ checklistId: 'cl-1' });

    expect(output.tasks).toHaveLength(2);
    const [deployed, pending] = output.tasks;
    expect(deployed.title).toBe('Deploy');
    expect(deployed.completed).toBe(true);
    expect(deployed.completedAt).toBeDefined();
    expect(pending.title).toBe('Smoke test');
    expect(pending.completed).toBe(false);
    expect(pending.completedAt).toBeUndefined();
  });

  it('returns createdAt and updatedAt dates', async () => {
    const cl = Checklist.create('cl-1', 'Dated');
    vi.mocked(repository.findById).mockResolvedValue(cl);

    const output = await useCase.execute({ checklistId: 'cl-1' });

    expect(output.createdAt).toBeInstanceOf(Date);
    expect(output.updatedAt).toBeInstanceOf(Date);
  });
});
