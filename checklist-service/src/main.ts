import 'dotenv/config';
import express from 'express';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { PrismaChecklistRepository } from './adapters/db/PrismaChecklistRepository';
import { RabbitMQEventPublisher } from './adapters/queue/RabbitMQEventPublisher';
import { buildChecklistRouter } from './adapters/http/checklistRouter';
import { connectConsumerWithRetry } from './infrastructure/http/server';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
const DATABASE_URL = process.env.DATABASE_URL ?? '';

async function bootstrap() {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  const repository = new PrismaChecklistRepository(prisma);
  const eventPublisher = new RabbitMQEventPublisher(RABBITMQ_URL);
  await eventPublisher.connect();

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'checklist-service', timestamp: new Date() });
  });

  app.use('/checklists', buildChecklistRouter(repository, eventPublisher));

  app.listen(PORT, () => {
    console.log(`checklist-service running on port ${PORT}`);
  });

  // Start RabbitMQ consumer — retries every 5 s if broker not yet ready
  connectConsumerWithRetry(repository, eventPublisher, RABBITMQ_URL).catch(console.error);

  const shutdown = async () => {
    await eventPublisher.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start service:', err);
  process.exit(1);
});
