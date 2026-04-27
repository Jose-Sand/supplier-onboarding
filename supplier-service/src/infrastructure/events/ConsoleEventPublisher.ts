import { DomainEvent } from '../../domain/events/DomainEvent';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

export class ConsoleEventPublisher implements IEventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    console.log(`[Event] ${event.eventName}`, {
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt,
    });
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
