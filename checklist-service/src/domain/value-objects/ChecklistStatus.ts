export enum ChecklistStatusValue {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class ChecklistStatus {
  private constructor(private readonly value: ChecklistStatusValue) {}

  static pending(): ChecklistStatus {
    return new ChecklistStatus(ChecklistStatusValue.PENDING);
  }

  static inProgress(): ChecklistStatus {
    return new ChecklistStatus(ChecklistStatusValue.IN_PROGRESS);
  }

  static completed(): ChecklistStatus {
    return new ChecklistStatus(ChecklistStatusValue.COMPLETED);
  }

  static fromString(value: string): ChecklistStatus {
    const normalized = value.toUpperCase() as ChecklistStatusValue;
    if (!Object.values(ChecklistStatusValue).includes(normalized)) {
      throw new Error(`Invalid checklist status: ${value}`);
    }
    return new ChecklistStatus(normalized);
  }

  isPending(): boolean {
    return this.value === ChecklistStatusValue.PENDING;
  }

  isInProgress(): boolean {
    return this.value === ChecklistStatusValue.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.value === ChecklistStatusValue.COMPLETED;
  }

  equals(other: ChecklistStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
