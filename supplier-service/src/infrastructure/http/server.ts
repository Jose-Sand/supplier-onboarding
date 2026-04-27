import express from 'express';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';
import { buildSupplierRouter } from '../../adapters/http/supplierRouter';

export function createServer(
  repository: ISupplierRepository,
  eventPublisher: IEventPublisher,
): express.Application {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'supplier-service', timestamp: new Date() });
  });

  app.use('/suppliers', buildSupplierRouter(repository, eventPublisher));

  return app;
}
