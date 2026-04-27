import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApproveSupplier } from '../../src/application/use-cases/ApproveSupplier';
import { ISupplierRepository } from '../../src/domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../src/domain/ports/IEventPublisher';
import { Supplier } from '../../src/domain/entities/Supplier';

const SUPPLIER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

function pendingSupplier() {
  const s = Supplier.create(SUPPLIER_ID, 'Acme Corp', 'contact@acme.com', '+15550100', 'US');
  s.pullDomainEvents(); // clear registration event
  return s;
}

function makeRepository(supplier: Supplier | null): ISupplierRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(supplier),
    findByEmail: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeEventPublisher(): IEventPublisher {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    publishAll: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ApproveSupplier use case', () => {
  let repository: ISupplierRepository;
  let eventPublisher: IEventPublisher;
  let useCase: ApproveSupplier;

  beforeEach(() => {
    repository = makeRepository(pendingSupplier());
    eventPublisher = makeEventPublisher();
    useCase = new ApproveSupplier(repository, eventPublisher);
  });

  it('returns APPROVED status', async () => {
    const output = await useCase.execute({ supplierId: SUPPLIER_ID });
    expect(output.status).toBe('APPROVED');
  });

  it('calls repository.save with the updated supplier', async () => {
    await useCase.execute({ supplierId: SUPPLIER_ID });
    expect(repository.save).toHaveBeenCalledOnce();
    const saved = vi.mocked(repository.save).mock.calls[0][0];
    expect(saved.status.isApproved()).toBe(true);
  });

  it('publishes SupplierApproved event', async () => {
    await useCase.execute({ supplierId: SUPPLIER_ID });
    const [events] = vi.mocked(eventPublisher.publishAll).mock.calls[0];
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe('supplier.approved');
  });

  it('throws when supplier is not found', async () => {
    repository = makeRepository(null);
    useCase = new ApproveSupplier(repository, eventPublisher);

    await expect(useCase.execute({ supplierId: SUPPLIER_ID })).rejects.toThrow('not found');
  });

  it('throws when supplier is already approved', async () => {
    const supplier = pendingSupplier();
    supplier.approve();
    supplier.pullDomainEvents();
    repository = makeRepository(supplier);
    useCase = new ApproveSupplier(repository, eventPublisher);

    await expect(useCase.execute({ supplierId: SUPPLIER_ID })).rejects.toThrow('Cannot approve');
  });
});
