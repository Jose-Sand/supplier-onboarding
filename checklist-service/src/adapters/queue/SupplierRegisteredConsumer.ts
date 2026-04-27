import amqplib from 'amqplib';
import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';
import { CreateChecklist } from '../../application/use-cases/CreateChecklist';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqpChannel   = Awaited<ReturnType<AmqpConnection['createChannel']>>;

const EXCHANGE    = 'supplier.events';
const ROUTING_KEY = 'supplier.registered';
const QUEUE       = 'checklist.supplier.registered';

const ONBOARDING_TASKS = [
  { title: 'Documentos legales enviados' },
  { title: 'Contrato firmado' },
  { title: 'Información bancaria registrada' },
  { title: 'Capacitación inicial completada' },
  { title: 'Visita de auditoría programada' },
];

interface SupplierRegisteredPayload {
  eventId?: string;
  eventName?: string;
  supplierId?: string;
  aggregateId?: string;
  occurredAt?: string;
  payload?: {
    companyName?: string;
    email?: string;
    country?: string;
  };
}

export class SupplierRegisteredConsumer {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;

  constructor(
    private readonly rabbitmqUrl: string,
    private readonly repository: IChecklistRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async connect(): Promise<void> {
    this.connection = await amqplib.connect(this.rabbitmqUrl);
    this.channel    = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await this.channel.assertQueue(QUEUE, { durable: true });
    await this.channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    this.channel.prefetch(1);

    await this.channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      try {
        const event: SupplierRegisteredPayload = JSON.parse(msg.content.toString());
        console.log('[Consumer] Raw event payload:', JSON.stringify(event));

        const supplierId  = event.supplierId ?? event.aggregateId;
        const companyName = event.payload?.companyName ?? 'Unknown';

        console.log(`[Consumer] supplier.registered → creating checklist for ${companyName}`);

        const useCase = new CreateChecklist(this.repository, this.eventPublisher);
        await useCase.execute({
          supplierId,
          title: `Checklist de onboarding - ${companyName}`,
          tasks: ONBOARDING_TASKS,
        });

        this.channel!.ack(msg);
        console.log(`[Consumer] Checklist created for supplierId=${supplierId}`);
      } catch (err) {
        console.error('[Consumer] Failed to process supplier.registered:', err);
        // nack without requeue to avoid poison-pill loops
        this.channel!.nack(msg, false, false);
      }
    });

    console.log(`[Consumer] Listening on queue "${QUEUE}" (exchange: ${EXCHANGE}, key: ${ROUTING_KEY})`);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
