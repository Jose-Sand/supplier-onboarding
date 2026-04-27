import amqplib from 'amqplib';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

type AmqpConnection = Awaited<ReturnType<typeof amqplib.connect>>;
type AmqpChannel  = Awaited<ReturnType<AmqpConnection['createChannel']>>;

const EXCHANGE = 'supplier.events';

export class RabbitMQEventPublisher implements IEventPublisher {
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    this.connection = await amqplib.connect(this.url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log(`[RabbitMQ] Connected — exchange: ${EXCHANGE}`);
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.ensureConnected();

    const payload = Buffer.from(
      JSON.stringify({
        eventId: event.eventId,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        supplierId: event.aggregateId,   // explicit alias consumed by other services
        occurredAt: event.occurredAt,
        payload: event,
      }),
    );

    this.channel!.publish(EXCHANGE, event.eventName, payload, {
      contentType: 'application/json',
      persistent: true,
      messageId: event.eventId,
      timestamp: event.occurredAt.getTime(),
    });
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async ensureConnected(): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }
  }
}
