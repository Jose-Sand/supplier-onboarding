import { Checklist, ChecklistProps } from '../../domain/entities/Checklist';
import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';

export class InMemoryChecklistRepository implements IChecklistRepository {
  private readonly store = new Map<string, ChecklistProps>();

  async save(checklist: Checklist): Promise<void> {
    this.store.set(checklist.id, checklist.toSnapshot());
  }

  async findById(id: string): Promise<Checklist | null> {
    const snapshot = this.store.get(id);
    if (!snapshot) return null;
    return Checklist.reconstitute({ ...snapshot, tasks: [...snapshot.tasks] });
  }

  async findBySupplierId(supplierId: string): Promise<Checklist[]> {
    return Array.from(this.store.values())
      .filter((snapshot) => snapshot.supplierId === supplierId)
      .map((snapshot) => Checklist.reconstitute({ ...snapshot, tasks: [...snapshot.tasks] }));
  }

  async findAll(): Promise<Checklist[]> {
    return Array.from(this.store.values()).map((snapshot) =>
      Checklist.reconstitute({ ...snapshot, tasks: [...snapshot.tasks] }),
    );
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
