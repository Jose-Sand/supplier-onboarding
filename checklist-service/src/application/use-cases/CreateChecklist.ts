import { v4 as uuidv4 } from 'uuid';
import { Checklist } from '../../domain/entities/Checklist';
import { Task } from '../../domain/entities/Task';
import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

export interface CreateChecklistInput {
  supplierId?: string;
  title: string;
  description?: string;
  tasks?: Array<{ title: string; description?: string }>;
}

export interface CreateChecklistOutput {
  id: string;
  title: string;
  description?: string;
  status: string;
  taskCount: number;
  createdAt: Date;
}

export class CreateChecklist {
  constructor(
    private readonly checklistRepository: IChecklistRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: CreateChecklistInput): Promise<CreateChecklistOutput> {
    const checklistId = uuidv4();
    const checklist = Checklist.create(checklistId, input.title, input.description, input.supplierId);

    if (input.tasks && input.tasks.length > 0) {
      for (const taskInput of input.tasks) {
        const task = Task.create(uuidv4(), taskInput.title, taskInput.description);
        checklist.addTask(task);
      }
    }

    await this.checklistRepository.save(checklist);

    const events = checklist.pullDomainEvents();
    await this.eventPublisher.publishAll(events);

    const snapshot = checklist.toSnapshot();
    return {
      id: snapshot.id,
      title: snapshot.title,
      description: snapshot.description,
      status: snapshot.status,
      taskCount: snapshot.tasks.length,
      createdAt: snapshot.createdAt,
    };
  }
}
