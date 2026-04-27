import { describe, it, expect } from 'vitest';
import { Supplier } from '../../src/domain/entities/Supplier';
import { SupplierRegistered } from '../../src/domain/events/SupplierRegistered';
import { SupplierApproved } from '../../src/domain/events/SupplierApproved';
import { SupplierRejected } from '../../src/domain/events/SupplierRejected';

const DEFAULTS = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  companyName: 'Acme Corp',
  email: 'contact@acme.com',
  phone: '+15550100',
  country: 'US',
};

function makeSupplier() {
  return Supplier.create(
    DEFAULTS.id,
    DEFAULTS.companyName,
    DEFAULTS.email,
    DEFAULTS.phone,
    DEFAULTS.country,
  );
}

describe('Supplier entity', () => {
  describe('create()', () => {
    it('creates a supplier with PENDING status', () => {
      const supplier = makeSupplier();
      expect(supplier.status.isPending()).toBe(true);
    });

    it('normalizes country to uppercase', () => {
      const supplier = Supplier.create(DEFAULTS.id, 'Corp', 'a@b.com', '+15550100', 'us');
      expect(supplier.country).toBe('US');
    });

    it('trims companyName', () => {
      const supplier = Supplier.create(DEFAULTS.id, '  Acme  ', 'a@b.com', '+15550100', 'US');
      expect(supplier.companyName).toBe('Acme');
    });

    it('emits SupplierRegistered event', () => {
      const supplier = makeSupplier();
      const events = supplier.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SupplierRegistered);
      expect(events[0].aggregateId).toBe(DEFAULTS.id);
    });

    it('clears events after pull', () => {
      const supplier = makeSupplier();
      supplier.pullDomainEvents();
      expect(supplier.pullDomainEvents()).toHaveLength(0);
    });

    it('throws when companyName is empty', () => {
      expect(() => Supplier.create(DEFAULTS.id, '', 'a@b.com', '+15550100', 'US'))
        .toThrow('companyName cannot be empty');
    });

    it('throws when companyName is whitespace-only', () => {
      expect(() => Supplier.create(DEFAULTS.id, '   ', 'a@b.com', '+15550100', 'US'))
        .toThrow('companyName cannot be empty');
    });

    it('throws when country is empty', () => {
      expect(() => Supplier.create(DEFAULTS.id, 'Corp', 'a@b.com', '+15550100', ''))
        .toThrow('country cannot be empty');
    });

    it('throws on invalid email', () => {
      expect(() => Supplier.create(DEFAULTS.id, 'Corp', 'not-an-email', '+15550100', 'US'))
        .toThrow('Invalid email');
    });
  });

  describe('approve()', () => {
    it('transitions PENDING → APPROVED', () => {
      const supplier = makeSupplier();
      supplier.pullDomainEvents();
      supplier.approve();
      expect(supplier.status.isApproved()).toBe(true);
    });

    it('emits SupplierApproved event', () => {
      const supplier = makeSupplier();
      supplier.pullDomainEvents();
      supplier.approve();
      const events = supplier.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SupplierApproved);
    });

    it('throws when already approved', () => {
      const supplier = makeSupplier();
      supplier.approve();
      expect(() => supplier.approve()).toThrow('Cannot approve');
    });

    it('throws when rejected', () => {
      const supplier = makeSupplier();
      supplier.reject();
      expect(() => supplier.approve()).toThrow('Cannot approve');
    });
  });

  describe('reject()', () => {
    it('transitions PENDING → REJECTED', () => {
      const supplier = makeSupplier();
      supplier.pullDomainEvents();
      supplier.reject();
      expect(supplier.status.isRejected()).toBe(true);
    });

    it('emits SupplierRejected event with optional reason', () => {
      const supplier = makeSupplier();
      supplier.pullDomainEvents();
      supplier.reject('Missing documents');
      const events = supplier.pullDomainEvents();
      expect(events).toHaveLength(1);
      const evt = events[0] as SupplierRejected;
      expect(evt).toBeInstanceOf(SupplierRejected);
      expect(evt.reason).toBe('Missing documents');
    });

    it('throws when already rejected', () => {
      const supplier = makeSupplier();
      supplier.reject();
      expect(() => supplier.reject()).toThrow('already rejected');
    });

    it('throws when already approved', () => {
      const supplier = makeSupplier();
      supplier.approve();
      expect(() => supplier.reject()).toThrow('Cannot reject an already approved');
    });
  });

  describe('suspend()', () => {
    it('transitions APPROVED → SUSPENDED', () => {
      const supplier = makeSupplier();
      supplier.approve();
      supplier.suspend();
      expect(supplier.status.isSuspended()).toBe(true);
    });

    it('throws when not approved', () => {
      const supplier = makeSupplier();
      expect(() => supplier.suspend()).toThrow('Cannot suspend');
    });
  });

  describe('toSnapshot()', () => {
    it('returns a plain object with all fields', () => {
      const supplier = makeSupplier();
      const snap = supplier.toSnapshot();
      expect(snap.id).toBe(DEFAULTS.id);
      expect(snap.companyName).toBe(DEFAULTS.companyName);
      expect(snap.email).toBe(DEFAULTS.email);
      expect(snap.status).toBe('PENDING');
      expect(snap.createdAt).toBeInstanceOf(Date);
    });
  });
});
