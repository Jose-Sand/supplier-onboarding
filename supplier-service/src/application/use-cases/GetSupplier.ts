import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { SupplierProps } from '../../domain/entities/Supplier';

export interface GetSupplierInput {
  supplierId: string;
}

export type GetSupplierOutput = Omit<SupplierProps, 'status'> & { status: string };

export class GetSupplier {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(input: GetSupplierInput): Promise<GetSupplierOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new Error(`Supplier with id "${input.supplierId}" not found`);
    }
    return supplier.toSnapshot();
  }
}
