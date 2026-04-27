import { DomainEvent } from './DomainEvent';

export class SupplierRejected extends DomainEvent {
  constructor(
    supplierId: string,
    public readonly companyName: string,
    public readonly reason?: string,
  ) {
    super(supplierId, 'supplier.rejected');
  }
}
