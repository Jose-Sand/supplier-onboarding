import { Router, Request, Response } from 'express';
import { CreateChecklist } from '../../../application/use-cases/CreateChecklist';
import { CompleteTask } from '../../../application/use-cases/CompleteTask';
import { GetChecklistProgress } from '../../../application/use-cases/GetChecklistProgress';
import { IChecklistRepository } from '../../../domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../../domain/ports/IEventPublisher';

export function buildChecklistRoutes(
  repository: IChecklistRepository,
  eventPublisher: IEventPublisher,
): Router {
  const router = Router();

  const createChecklist = new CreateChecklist(repository, eventPublisher);
  const completeTask = new CompleteTask(repository, eventPublisher);
  const getChecklistProgress = new GetChecklistProgress(repository);

  router.post('/', async (req: Request, res: Response) => {
    try {
      const result = await createChecklist.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  });

  router.get('/:id/progress', async (req: Request, res: Response) => {
    try {
      const result = await getChecklistProgress.execute({ checklistId: req.params.id });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: message });
    }
  });

  router.patch('/:id/tasks/:taskId/complete', async (req: Request, res: Response) => {
    try {
      const result = await completeTask.execute({
        checklistId: req.params.id,
        taskId: req.params.taskId,
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: message });
    }
  });

  return router;
}
