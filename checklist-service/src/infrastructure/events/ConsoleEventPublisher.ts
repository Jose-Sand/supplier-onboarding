import { DomainEvent } from '../../domain/events/DomainEvent';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

export class ConsoleEventPublisher implements IEventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    console.log('[EVENT]', JSON.stringify({
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
      payload: event,
    }, null, 2));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
