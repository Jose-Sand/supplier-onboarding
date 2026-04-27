// Accepts E.164 format (+<country><number>, 7–15 digits) or common local patterns.
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export class Phone {
  private constructor(private readonly value: string) {}

  static create(raw: string): Phone {
    const normalized = raw.replace(/[\s\-().]/g, '');
    if (!PHONE_REGEX.test(normalized)) {
      throw new Error(`Invalid phone number: ${raw}`);
    }
    return new Phone(normalized);
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
