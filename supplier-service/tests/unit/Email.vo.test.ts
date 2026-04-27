import { describe, it, expect } from 'vitest';
import { Email } from '../../src/domain/value-objects/Email';

describe('Email value object', () => {
  it('creates a valid email', () => {
    const email = Email.create('Contact@Acme.COM');
    expect(email.toString()).toBe('contact@acme.com');
  });

  it('trims whitespace', () => {
    const email = Email.create('  user@example.com  ');
    expect(email.toString()).toBe('user@example.com');
  });

  it('lowercases the email', () => {
    const email = Email.create('USER@EXAMPLE.COM');
    expect(email.toString()).toBe('user@example.com');
  });

  it('throws on missing @', () => {
    expect(() => Email.create('notanemail')).toThrow('Invalid email');
  });

  it('throws on missing domain', () => {
    expect(() => Email.create('user@')).toThrow('Invalid email');
  });

  it('throws on missing TLD', () => {
    expect(() => Email.create('user@domain')).toThrow('Invalid email');
  });

  it('equals() compares normalized values', () => {
    const a = Email.create('user@example.com');
    const b = Email.create('USER@EXAMPLE.COM');
    expect(a.equals(b)).toBe(true);
  });

  it('equals() returns false for different emails', () => {
    const a = Email.create('a@example.com');
    const b = Email.create('b@example.com');
    expect(a.equals(b)).toBe(false);
  });
});
