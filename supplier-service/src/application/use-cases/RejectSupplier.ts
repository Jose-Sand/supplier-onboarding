import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

export interface RejectSupplierInput {
  supplierId: string;
  reason?: string;
}

export interface RejectSupplierOutput {
  id: string;
  companyName: string;
  status: string;
  updatedAt: Date;
}

export class RejectSupplier {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: RejectSupplierInput): Promise<RejectSupplierOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new Error(`Supplier with id "${input.supplierId}" not found`);
    }

    supplier.reject(input.reason);

    await this.supplierRepository.save(supplier);

    const events = supplier.pullDomainEvents();
    await this.eventPublisher.publishAll(events);

    const snap = supplier.toSnapshot();
    return {
      id: snap.id,
      companyName: snap.companyName,
      status: snap.status,
      updatedAt: snap.updatedAt,
    };
  }
}
