import { CreateChecklist } from './CreateChecklist';
import { CompleteTask } from './CompleteTask';
import { GetChecklistProgress } from './GetChecklistProgress';
import { InMemoryChecklistRepository } from '../../infrastructure/repositories/InMemoryChecklistRepository';
import { ConsoleEventPublisher } from '../../infrastructure/events/ConsoleEventPublisher';

const buildDeps = () => {
  const repository = new InMemoryChecklistRepository();
  const eventPublisher = new ConsoleEventPublisher();
  return { repository, eventPublisher };
};

describe('CompleteTask use case', () => {
  it('completes a task and updates progress', async () => {
    const { repository, eventPublisher } = buildDeps();

    const created = await new CreateChecklist(repository, eventPublisher).execute({
      title: 'Test checklist',
      tasks: [{ title: 'Task 1' }, { title: 'Task 2' }],
    });

    const progress = await new GetChecklistProgress(repository).execute({
      checklistId: created.id,
    });

    const result = await new CompleteTask(repository, eventPublisher).execute({
      checklistId: created.id,
      taskId: progress.tasks[0].id,
    });

    expect(result.completionPercentage).toBe(50);
    expect(result.checklistStatus).toBe('IN_PROGRESS');
  });

  it('emits ChecklistCompleted event when last task is completed', async () => {
    const { repository, eventPublisher } = buildDeps();
    const publishSpy = jest.spyOn(eventPublisher, 'publishAll');

    const created = await new CreateChecklist(repository, eventPublisher).execute({
      title: 'One task checklist',
      tasks: [{ title: 'Only task' }],
    });

    const progress = await new GetChecklistProgress(repository).execute({
      checklistId: created.id,
    });

    await new CompleteTask(repository, eventPublisher).execute({
      checklistId: created.id,
      taskId: progress.tasks[0].id,
    });

    expect(publishSpy).toHaveBeenCalledTimes(2);
    const lastCall = publishSpy.mock.calls[1][0];
    expect(lastCall[0].eventName).toBe('checklist.completed');
  });

  it('throws when checklist does not exist', async () => {
    const { repository, eventPublisher } = buildDeps();
    await expect(
      new CompleteTask(repository, eventPublisher).execute({
        checklistId: 'nonexistent',
        taskId: 'any-task',
      }),
    ).rejects.toThrow('not found');
  });
});
