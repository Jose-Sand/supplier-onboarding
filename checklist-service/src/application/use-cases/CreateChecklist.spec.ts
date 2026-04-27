import { CreateChecklist } from './CreateChecklist';
import { InMemoryChecklistRepository } from '../../infrastructure/repositories/InMemoryChecklistRepository';
import { ConsoleEventPublisher } from '../../infrastructure/events/ConsoleEventPublisher';

describe('CreateChecklist use case', () => {
  const repository = new InMemoryChecklistRepository();
  const eventPublisher = new ConsoleEventPublisher();
  const useCase = new CreateChecklist(repository, eventPublisher);

  it('creates a checklist with tasks and returns correct output', async () => {
    const result = await useCase.execute({
      title: 'Sprint 1',
      tasks: [
        { title: 'Design API' },
        { title: 'Implement endpoints' },
      ],
    });

    expect(result.title).toBe('Sprint 1');
    expect(result.status).toBe('PENDING');
    expect(result.taskCount).toBe(2);
    expect(result.id).toBeDefined();
  });

  it('creates a checklist without tasks', async () => {
    const result = await useCase.execute({ title: 'Empty checklist' });
    expect(result.taskCount).toBe(0);
    expect(result.status).toBe('PENDING');
  });

  it('throws when title is empty', async () => {
    await expect(useCase.execute({ title: '' })).rejects.toThrow('title cannot be empty');
  });
});
