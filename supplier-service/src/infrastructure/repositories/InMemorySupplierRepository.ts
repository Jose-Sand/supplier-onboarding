import { Supplier, SupplierProps } from '../../domain/entities/Supplier';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';

export class InMemorySupplierRepository implements ISupplierRepository {
  private readonly store = new Map<string, SupplierProps>();

  async save(supplier: Supplier): Promise<void> {
    this.store.set(supplier.id, supplier.toSnapshot());
  }

  async findById(id: string): Promise<Supplier | null> {
    const snapshot = this.store.get(id);
    if (!snapshot) return null;
    return Supplier.reconstitute({ ...snapshot });
  }

  async findByEmail(email: string): Promise<Supplier | null> {
    const normalized = email.trim().toLowerCase();
    for (const snapshot of this.store.values()) {
      if (snapshot.email === normalized) {
        return Supplier.reconstitute({ ...snapshot });
      }
    }
    return null;
  }

  async findAll(): Promise<Supplier[]> {
    return Array.from(this.store.values()).map((snapshot) =>
      Supplier.reconstitute({ ...snapshot }),
    );
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
