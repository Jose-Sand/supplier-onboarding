import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';

export interface GetChecklistProgressInput {
  checklistId: string;
}

export interface TaskProgress {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: Date;
}

export interface GetChecklistProgressOutput {
  id: string;
  title: string;
  description?: string;
  status: string;
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  tasks: TaskProgress[];
  createdAt: Date;
  updatedAt: Date;
}

export class GetChecklistProgress {
  constructor(private readonly checklistRepository: IChecklistRepository) {}

  async execute(input: GetChecklistProgressInput): Promise<GetChecklistProgressOutput> {
    const checklist = await this.checklistRepository.findById(input.checklistId);
    if (!checklist) {
      throw new Error(`Checklist with id "${input.checklistId}" not found`);
    }

    const tasks = checklist.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      completedAt: task.completedAt,
    }));

    const completedTasks = tasks.filter((t) => t.completed).length;

    return {
      id: checklist.id,
      title: checklist.title,
      description: checklist.description,
      status: checklist.status.toString(),
      completionPercentage: checklist.getCompletionPercentage().getValue(),
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks: tasks.length - completedTasks,
      tasks,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt,
    };
  }
}
