import { describe, it, expect } from 'vitest';
import { Phone } from '../../src/domain/value-objects/Phone';

describe('Phone value object', () => {
  it('accepts E.164 format', () => {
    const phone = Phone.create('+15550100');
    expect(phone.toString()).toBe('+15550100');
  });

  it('strips spaces, dashes, and parentheses', () => {
    const phone = Phone.create('+1 (555) 01-00');
    expect(phone.toString()).toBe('+15550100');
  });

  it('accepts number without leading +', () => {
    const phone = Phone.create('15550100');
    expect(phone.toString()).toBe('15550100');
  });

  it('throws when number is too short', () => {
    expect(() => Phone.create('+123')).toThrow('Invalid phone');
  });

  it('throws when number starts with 0', () => {
    expect(() => Phone.create('0123456789')).toThrow('Invalid phone');
  });

  it('equals() compares normalized values', () => {
    const a = Phone.create('+1 555 0100');
    const b = Phone.create('+15550100');
    expect(a.equals(b)).toBe(true);
  });

  it('equals() returns false for different phones', () => {
    const a = Phone.create('+15550100');
    const b = Phone.create('+15550101');
    expect(a.equals(b)).toBe(false);
  });
});
