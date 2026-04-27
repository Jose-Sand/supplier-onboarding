import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterSupplier } from '../../src/application/use-cases/RegisterSupplier';
import { ISupplierRepository } from '../../src/domain/ports/ISupplierRepository';
import { IEventPublisher } from '../../src/domain/ports/IEventPublisher';
import { Supplier } from '../../src/domain/entities/Supplier';

function makeRepository(overrides: Partial<ISupplierRepository> = {}): ISupplierRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeEventPublisher(): IEventPublisher {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    publishAll: vi.fn().mockResolvedValue(undefined),
  };
}

const VALID_INPUT = {
  companyName: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '+15550100',
  country: 'US',
};

describe('RegisterSupplier use case', () => {
  let repository: ISupplierRepository;
  let eventPublisher: IEventPublisher;
  let useCase: RegisterSupplier;

  beforeEach(() => {
    repository = makeRepository();
    eventPublisher = makeEventPublisher();
    useCase = new RegisterSupplier(repository, eventPublisher);
  });

  describe('successful registration', () => {
    it('saves the supplier and returns a generated id', async () => {
      const output = await useCase.execute(VALID_INPUT);

      expect(repository.save).toHaveBeenCalledOnce();
      expect(output.id).toBeDefined();
      expect(typeof output.id).toBe('string');
    });

    it('returns PENDING status on creation', async () => {
      const output = await useCase.execute(VALID_INPUT);
      expect(output.status).toBe('PENDING');
    });

    it('returns the companyName and email from input', async () => {
      const output = await useCase.execute(VALID_INPUT);
      expect(output.companyName).toBe('Acme Corp');
      expect(output.email).toBe('contact@acme.com');
    });

    it('passes a Supplier aggregate to repository.save', async () => {
      await useCase.execute(VALID_INPUT);
      const saved = vi.mocked(repository.save).mock.calls[0][0];
      expect(saved).toBeInstanceOf(Supplier);
    });

    it('includes createdAt in the output', async () => {
      const before = new Date();
      const output = await useCase.execute(VALID_INPUT);
      const after = new Date();
      expect(output.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(output.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('event publishing', () => {
    it('calls publishAll with one SupplierRegistered event', async () => {
      await useCase.execute(VALID_INPUT);

      expect(eventPublisher.publishAll).toHaveBeenCalledOnce();
      const [events] = vi.mocked(eventPublisher.publishAll).mock.calls[0];
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('supplier.registered');
    });
  });

  describe('email uniqueness', () => {
    it('throws when email is already registered', async () => {
      const existing = Supplier.create('some-id', 'Other Corp', 'contact@acme.com', '+15550101', 'US');
      repository = makeRepository({ findByEmail: vi.fn().mockResolvedValue(existing) });
      useCase = new RegisterSupplier(repository, eventPublisher);

      await expect(useCase.execute(VALID_INPUT)).rejects.toThrow('already exists');
    });

    it('does not call save when email is taken', async () => {
      const existing = Supplier.create('some-id', 'Other Corp', 'contact@acme.com', '+15550101', 'US');
      repository = makeRepository({ findByEmail: vi.fn().mockResolvedValue(existing) });
      useCase = new RegisterSupplier(repository, eventPublisher);

      await useCase.execute(VALID_INPUT).catch(() => {});
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
