export enum SupplierStatusValue {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export class SupplierStatus {
  private constructor(private readonly value: SupplierStatusValue) {}

  static pending(): SupplierStatus {
    return new SupplierStatus(SupplierStatusValue.PENDING);
  }

  static approved(): SupplierStatus {
    return new SupplierStatus(SupplierStatusValue.APPROVED);
  }

  static rejected(): SupplierStatus {
    return new SupplierStatus(SupplierStatusValue.REJECTED);
  }

  static suspended(): SupplierStatus {
    return new SupplierStatus(SupplierStatusValue.SUSPENDED);
  }

  static fromString(value: string): SupplierStatus {
    const normalized = value.toUpperCase() as SupplierStatusValue;
    if (!Object.values(SupplierStatusValue).includes(normalized)) {
      throw new Error(`Invalid supplier status: ${value}`);
    }
    return new SupplierStatus(normalized);
  }

  isPending(): boolean   { return this.value === SupplierStatusValue.PENDING; }
  isApproved(): boolean  { return this.value === SupplierStatusValue.APPROVED; }
  isRejected(): boolean  { return this.value === SupplierStatusValue.REJECTED; }
  isSuspended(): boolean { return this.value === SupplierStatusValue.SUSPENDED; }

  equals(other: SupplierStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
