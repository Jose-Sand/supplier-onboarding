import { describe, it, expect } from 'vitest';
import { SupplierStatus } from '../../src/domain/value-objects/SupplierStatus';

describe('SupplierStatus value object', () => {
  it('creates PENDING via factory', () => {
    expect(SupplierStatus.pending().isPending()).toBe(true);
  });

  it('creates APPROVED via factory', () => {
    expect(SupplierStatus.approved().isApproved()).toBe(true);
  });

  it('creates REJECTED via factory', () => {
    expect(SupplierStatus.rejected().isRejected()).toBe(true);
  });

  it('creates SUSPENDED via factory', () => {
    expect(SupplierStatus.suspended().isSuspended()).toBe(true);
  });

  it('parses case-insensitive string', () => {
    expect(SupplierStatus.fromString('pending').isPending()).toBe(true);
    expect(SupplierStatus.fromString('APPROVED').isApproved()).toBe(true);
  });

  it('throws on unknown status', () => {
    expect(() => SupplierStatus.fromString('UNKNOWN')).toThrow('Invalid supplier status');
  });

  it('equals() compares by value', () => {
    expect(SupplierStatus.pending().equals(SupplierStatus.pending())).toBe(true);
    expect(SupplierStatus.pending().equals(SupplierStatus.approved())).toBe(false);
  });

  it('toString() returns the raw string value', () => {
    expect(SupplierStatus.approved().toString()).toBe('APPROVED');
  });

  it('isPending/isApproved/isRejected/isSuspended are mutually exclusive', () => {
    const s = SupplierStatus.suspended();
    expect(s.isPending()).toBe(false);
    expect(s.isApproved()).toBe(false);
    expect(s.isRejected()).toBe(false);
    expect(s.isSuspended()).toBe(true);
  });
});
