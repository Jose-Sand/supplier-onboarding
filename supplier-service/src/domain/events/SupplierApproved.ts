import { DomainEvent } from './DomainEvent';

export class SupplierApproved extends DomainEvent {
  constructor(
    supplierId: string,
    public readonly companyName: string,
  ) {
    super(supplierId, 'supplier.approved');
  }
}
