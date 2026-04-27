import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RejectSupplier } from '../../src/application/use-cases/RejectSupplier';
import { ISupplierRepository } from '../../src/domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../src/domain/ports/IEventPublisher';
import { Supplier } from '../../src/domain/entities/Supplier';
import { SupplierRejected } from '../../src/domain/events/SupplierRejected';

const SUPPLIER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

function pendingSupplier() {
  const s = Supplier.create(SUPPLIER_ID, 'Acme Corp', 'contact@acme.com', '+15550100', 'US');
  s.pullDomainEvents();
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

describe('RejectSupplier use case', () => {
  let repository: ISupplierRepository;
  let eventPublisher: IEventPublisher;
  let useCase: RejectSupplier;

  beforeEach(() => {
    repository = makeRepository(pendingSupplier());
    eventPublisher = makeEventPublisher();
    useCase = new RejectSupplier(repository, eventPublisher);
  });

  it('returns REJECTED status', async () => {
    const output = await useCase.execute({ supplierId: SUPPLIER_ID });
    expect(output.status).toBe('REJECTED');
  });

  it('calls repository.save with the updated supplier', async () => {
    await useCase.execute({ supplierId: SUPPLIER_ID });
    expect(repository.save).toHaveBeenCalledOnce();
    const saved = vi.mocked(repository.save).mock.calls[0][0];
    expect(saved.status.isRejected()).toBe(true);
  });

  it('publishes SupplierRejected event', async () => {
    await useCase.execute({ supplierId: SUPPLIER_ID, reason: 'Missing documents' });
    const [events] = vi.mocked(eventPublisher.publishAll).mock.calls[0];
    expect(events).toHaveLength(1);
    const evt = events[0] as SupplierRejected;
    expect(evt.eventName).toBe('supplier.rejected');
    expect(evt.reason).toBe('Missing documents');
  });

  it('publishes event without reason when none provided', async () => {
    await useCase.execute({ supplierId: SUPPLIER_ID });
    const [events] = vi.mocked(eventPublisher.publishAll).mock.calls[0];
    const evt = events[0] as SupplierRejected;
    expect(evt.reason).toBeUndefined();
  });

  it('throws when supplier is not found', async () => {
    repository = makeRepository(null);
    useCase = new RejectSupplier(repository, eventPublisher);

    await expect(useCase.execute({ supplierId: SUPPLIER_ID })).rejects.toThrow('not found');
  });

  it('throws when supplier is already rejected', async () => {
    const supplier = pendingSupplier();
    supplier.reject();
    supplier.pullDomainEvents();
    repository = makeRepository(supplier);
    useCase = new RejectSupplier(repository, eventPublisher);

    await expect(useCase.execute({ supplierId: SUPPLIER_ID })).rejects.toThrow('already rejected');
  });
});
