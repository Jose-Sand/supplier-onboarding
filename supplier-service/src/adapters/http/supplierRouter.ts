import { Router } from 'express';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';
import { RegisterSupplier } from '../../application/use-cases/RegisterSupplier';
import { ApproveSupplier } from '../../application/use-cases/ApproveSupplier';
import { RejectSupplier } from '../../application/use-cases/RejectSupplier';
import { GetSupplier } from '../../application/use-cases/GetSupplier';
import { ListSuppliers } from '../../application/use-cases/ListSuppliers';
import { SupplierController } from './SupplierController';

export function buildSupplierRouter(
  repository: ISupplierRepository,
  eventPublisher: IEventPublisher,
): Router {
  const controller = new SupplierController(
    new RegisterSupplier(repository, eventPublisher),
    new ApproveSupplier(repository, eventPublisher),
    new RejectSupplier(repository, eventPublisher),
    new GetSupplier(repository),
    new ListSuppliers(repository),
  );

  const router = Router();

  router.post('/', controller.register);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.patch('/:id/approve', controller.approve);
  router.patch('/:id/reject', controller.reject);

  return router;
}
