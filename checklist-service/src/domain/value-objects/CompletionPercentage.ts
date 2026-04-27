export class CompletionPercentage {
  private readonly value: number;

  private constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error(`CompletionPercentage must be between 0 and 100, got: ${value}`);
    }
    this.value = Math.round(value * 100) / 100;
  }

  static of(completed: number, total: number): CompletionPercentage {
    if (total === 0) return new CompletionPercentage(0);
    return new CompletionPercentage((completed / total) * 100);
  }

  static fromValue(value: number): CompletionPercentage {
    return new CompletionPercentage(value);
  }

  getValue(): number {
    return this.value;
  }

  isComplete(): boolean {
    return this.value === 100;
  }

  equals(other: CompletionPercentage): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return `${this.value}%`;
  }
}
