import { Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { CreateChecklist } from '../../application/use-cases/CreateChecklist';
import { CompleteTask } from '../../application/use-cases/CompleteTask';
import { GetChecklistProgress } from '../../application/use-cases/GetChecklistProgress';
import { GetChecklistsBySupplierId } from '../../application/use-cases/GetChecklistsBySupplierId';
import {
  createChecklistSchema,
  checklistIdSchema,
  completeTaskParamsSchema,
  supplierIdQuerySchema,
} from './schemas/checklist.schema';

function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

function handleError(res: Response, error: unknown): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = message.includes('not found') ? 404 : 400;
  res.status(status).json({ error: message });
}

export class ChecklistController {
  constructor(
    private readonly createChecklistUseCase: CreateChecklist,
    private readonly completeTaskUseCase: CompleteTask,
    private readonly getProgressUseCase: GetChecklistProgress,
    private readonly getBySupplierIdUseCase: GetChecklistsBySupplierId,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(createChecklistSchema, req.body);
      const result = await this.createChecklistUseCase.execute(body);
      res.status(201).json(result);
    } catch (error) {
      handleError(res, error);
    }
  };

  completeTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const params = validate(completeTaskParamsSchema, req.params);
      const result = await this.completeTaskUseCase.execute({
        checklistId: params.id,
        taskId: params.taskId,
      });
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };

  getProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const params = validate(checklistIdSchema, req.params);
      const result = await this.getProgressUseCase.execute({ checklistId: params.id });
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };

  listBySupplierId = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = validate(supplierIdQuerySchema, req.query);
      const result = await this.getBySupplierIdUseCase.execute(query.supplierId);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  };
}
