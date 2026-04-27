export interface TaskProps {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export class Task {
  private readonly _id: string;
  private _title: string;
  private _description?: string;
  private _completed: boolean;
  private _completedAt?: Date;
  private readonly _createdAt: Date;

  constructor(props: TaskProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }
    this._id = props.id;
    this._title = props.title.trim();
    this._description = props.description;
    this._completed = props.completed;
    this._completedAt = props.completedAt;
    this._createdAt = props.createdAt;
  }

  static create(id: string, title: string, description?: string): Task {
    return new Task({
      id,
      title,
      description,
      completed: false,
      createdAt: new Date(),
    });
  }

  complete(): void {
    if (this._completed) {
      throw new Error(`Task "${this._title}" is already completed`);
    }
    this._completed = true;
    this._completedAt = new Date();
  }

  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get description(): string | undefined { return this._description; }
  get completed(): boolean { return this._completed; }
  get completedAt(): Date | undefined { return this._completedAt; }
  get createdAt(): Date { return this._createdAt; }

  toSnapshot(): TaskProps {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      completed: this._completed,
      completedAt: this._completedAt,
      createdAt: this._createdAt,
    };
  }
}
