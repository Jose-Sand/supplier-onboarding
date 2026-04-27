import { ChecklistStatus } from '../value-objects/ChecklistStatus';
import { CompletionPercentage } from '../value-objects/CompletionPercentage';
import { ChecklistCompleted } from '../events/ChecklistCompleted';
import { DomainEvent } from '../events/DomainEvent';
import { Task, TaskProps } from './Task';

export interface ChecklistProps {
  id: string;
  supplierId?: string;
  title: string;
  description?: string;
  tasks: TaskProps[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Checklist {
  private readonly _id: string;
  private readonly _supplierId?: string;
  private _title: string;
  private _description?: string;
  private _tasks: Task[];
  private _status: ChecklistStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: DomainEvent[] = [];

  private constructor(props: ChecklistProps) {
    this._id = props.id;
    this._supplierId = props.supplierId;
    this._title = props.title;
    this._description = props.description;
    this._tasks = props.tasks.map((t) => new Task(t));
    this._status = ChecklistStatus.fromString(props.status);
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(id: string, title: string, description?: string, supplierId?: string): Checklist {
    if (!title || title.trim().length === 0) {
      throw new Error('Checklist title cannot be empty');
    }
    return new Checklist({
      id,
      supplierId,
      title: title.trim(),
      description,
      tasks: [],
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: ChecklistProps): Checklist {
    return new Checklist(props);
  }

  addTask(task: Task): void {
    const exists = this._tasks.some((t) => t.id === task.id);
    if (exists) {
      throw new Error(`Task with id "${task.id}" already exists in checklist`);
    }
    this._tasks.push(task);
    this.updateStatus();
    this._updatedAt = new Date();
  }

  completeTask(taskId: string): void {
    if (this._status.isCompleted()) {
      throw new Error('Cannot modify a completed checklist');
    }

    const task = this._tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task with id "${taskId}" not found`);
    }

    task.complete();
    this.updateStatus();
    this._updatedAt = new Date();

    if (this._status.isCompleted()) {
      this._domainEvents.push(
        new ChecklistCompleted(this._id, this._title, this._tasks.length),
      );
    }
  }

  getCompletionPercentage(): CompletionPercentage {
    const completed = this._tasks.filter((t) => t.completed).length;
    return CompletionPercentage.of(completed, this._tasks.length);
  }

  private updateStatus(): void {
    const total = this._tasks.length;
    const completed = this._tasks.filter((t) => t.completed).length;

    if (total === 0 || completed === 0) {
      this._status = ChecklistStatus.pending();
    } else if (completed === total) {
      this._status = ChecklistStatus.completed();
    } else {
      this._status = ChecklistStatus.inProgress();
    }
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  get id(): string                     { return this._id; }
  get supplierId(): string | undefined { return this._supplierId; }
  get title(): string                  { return this._title; }
  get description(): string | undefined { return this._description; }
  get tasks(): ReadonlyArray<Task>     { return [...this._tasks]; }
  get status(): ChecklistStatus        { return this._status; }
  get createdAt(): Date                { return this._createdAt; }
  get updatedAt(): Date                { return this._updatedAt; }

  toSnapshot(): ChecklistProps {
    return {
      id: this._id,
      supplierId: this._supplierId,
      title: this._title,
      description: this._description,
      tasks: this._tasks.map((t) => t.toSnapshot()),
      status: this._status.toString(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
