import { DomainEvent } from './DomainEvent';

export class SupplierRegistered extends DomainEvent {
  constructor(
    supplierId: string,
    public readonly companyName: string,
    public readonly email: string,
    public readonly country: string,
  ) {
    super(supplierId, 'supplier.registered');
  }
}
