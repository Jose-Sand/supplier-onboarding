import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

export interface CompleteTaskInput {
  checklistId: string;
  taskId: string;
}

export interface CompleteTaskOutput {
  checklistId: string;
  taskId: string;
  checklistStatus: string;
  completionPercentage: number;
}

export class CompleteTask {
  constructor(
    private readonly checklistRepository: IChecklistRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: CompleteTaskInput): Promise<CompleteTaskOutput> {
    const checklist = await this.checklistRepository.findById(input.checklistId);
    if (!checklist) {
      throw new Error(`Checklist with id "${input.checklistId}" not found`);
    }

    checklist.completeTask(input.taskId);

    await this.checklistRepository.save(checklist);

    const events = checklist.pullDomainEvents();
    await this.eventPublisher.publishAll(events);

    return {
      checklistId: checklist.id,
      taskId: input.taskId,
      checklistStatus: checklist.status.toString(),
      completionPercentage: checklist.getCompletionPercentage().getValue(),
    };
  }
}
