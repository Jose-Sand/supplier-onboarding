export abstract class DomainEvent {
  readonly occurredAt: Date;
  readonly eventId: string;

  constructor(
    public readonly aggregateId: string,
    public readonly eventName: string,
  ) {
    this.occurredAt = new Date();
    this.eventId = crypto.randomUUID();
  }
}
