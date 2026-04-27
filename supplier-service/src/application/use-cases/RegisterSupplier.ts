import { v4 as uuidv4 } from 'uuid';
import { Supplier } from '../../domain/entities/Supplier';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';

export interface RegisterSupplierInput {
  companyName: string;
  email: string;
  phone: string;
  country: string;
}

export interface RegisterSupplierOutput {
  id: string;
  companyName: string;
  email: string;
  status: string;
  createdAt: Date;
}

export class RegisterSupplier {
  constructor(
    private readonly supplierRepository: ISupplierRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: RegisterSupplierInput): Promise<RegisterSupplierOutput> {
    const existing = await this.supplierRepository.findByEmail(input.email);
    if (existing) {
      throw new Error(`A supplier with email "${input.email}" already exists`);
    }

    const supplier = Supplier.create(
      uuidv4(),
      input.companyName,
      input.email,
      input.phone,
      input.country,
    );

    await this.supplierRepository.save(supplier);

    const events = supplier.pullDomainEvents();
    await this.eventPublisher.publishAll(events);

    const snap = supplier.toSnapshot();
    return {
      id: snap.id,
      companyName: snap.companyName,
      email: snap.email,
      status: snap.status,
      createdAt: snap.createdAt,
    };
  }
}
