import { Supplier } from '../entities/Supplier';

export interface ISupplierRepository {
  save(supplier: Supplier): Promise<void>;
  findById(id: string): Promise<Supplier | null>;
  findByEmail(email: string): Promise<Supplier | null>;
  findAll(): Promise<Supplier[]>;
  delete(id: string): Promise<void>;
}
