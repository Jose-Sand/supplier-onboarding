import express from 'express';
import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';
import { buildChecklistRoutes } from './routes/checklistRoutes';
import { SupplierRegisteredConsumer } from '../../adapters/queue/SupplierRegisteredConsumer';

export function createServer(
  repository: IChecklistRepository,
  eventPublisher: IEventPublisher,
): express.Application {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'checklist-service', timestamp: new Date() });
  });

  app.use('/api/checklists', buildChecklistRoutes(repository, eventPublisher));

  return app;
}

export async function connectConsumerWithRetry(
  repository: IChecklistRepository,
  eventPublisher: IEventPublisher,
  rabbitmqUrl: string,
  retryMs = 5000,
): Promise<void> {
  const attempt = async (): Promise<void> => {
    try {
      const consumer = new SupplierRegisteredConsumer(rabbitmqUrl, repository, eventPublisher);
      await consumer.connect();
    } catch (err) {
      console.error(`[Consumer] Connection failed, retrying in ${retryMs}ms…`, (err as Error).message);
      setTimeout(() => void attempt(), retryMs);
    }
  };
  await attempt();
}
