import { DomainEvent } from './DomainEvent';

export class ChecklistCompleted extends DomainEvent {
  static readonly EVENT_NAME = 'checklist.completed';

  constructor(
    public readonly checklistId: string,
    public readonly checklistTitle: string,
    public readonly totalTasks: number,
  ) {
    super(checklistId, ChecklistCompleted.EVENT_NAME);
  }
}
