import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

export interface ApproveSupplierInput {
  supplierId: string;
}

export interface ApproveSupplierOutput {
  id: string;
  companyName: string;
  status: string;
  updatedAt: Date;
}

export class ApproveSupplier {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: ApproveSupplierInput): Promise<ApproveSupplierOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new Error(`Supplier with id "${input.supplierId}" not found`);
    }

    supplier.approve();

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
