import { Router } from 'express';
import { ChecklistController } from './ChecklistController';
import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';
import { CreateChecklist } from '../../application/use-cases/CreateChecklist';
import { CompleteTask } from '../../application/use-cases/CompleteTask';
import { GetChecklistProgress } from '../../application/use-cases/GetChecklistProgress';
import { GetChecklistsBySupplierId } from '../../application/use-cases/GetChecklistsBySupplierId';

export function buildChecklistRouter(
  repository: IChecklistRepository,
  eventPublisher: IEventPublisher,
): Router {
  const router = Router();

  const controller = new ChecklistController(
    new CreateChecklist(repository, eventPublisher),
    new CompleteTask(repository, eventPublisher),
    new GetChecklistProgress(repository),
    new GetChecklistsBySupplierId(repository),
  );

  // GET /checklists?supplierId=:id
  router.get('/', controller.listBySupplierId);

  // POST /checklists
  router.post('/', controller.create);

  // PATCH /checklists/:id/tasks/:taskId/complete
  router.patch('/:id/tasks/:taskId/complete', controller.completeTask);

  // GET /checklists/:id/progress
  router.get('/:id/progress', controller.getProgress);

  return router;
}
