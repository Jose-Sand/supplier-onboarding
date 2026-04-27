import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { SupplierProps } from '../../domain/entities/Supplier';

export type ListSuppliersOutput = SupplierProps[];

export class ListSuppliers {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(): Promise<ListSuppliersOutput> {
    const suppliers = await this.supplierRepository.findAll();
    return suppliers.map((s) => s.toSnapshot());
  }
}
