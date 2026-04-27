import { Supplier, SupplierProps } from '../../../domain/entities/Supplier';

// Shape returned by Prisma when querying the suppliers table.
interface PrismaSupplier {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SupplierPrismaMapper {
  static toDomain(raw: PrismaSupplier): Supplier {
    return Supplier.reconstitute({
      id: raw.id,
      companyName: raw.companyName,
      email: raw.email,
      phone: raw.phone,
      country: raw.country,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrismaCreate(supplier: Supplier): PrismaSupplier {
    const snap = supplier.toSnapshot();
    return {
      id: snap.id,
      companyName: snap.companyName,
      email: snap.email,
      phone: snap.phone,
      country: snap.country,
      status: snap.status,
      createdAt: snap.createdAt,
      updatedAt: supplier.updatedAt ?? new Date(),
    };
  }

  static toPrismaUpdate(supplier: Supplier): Partial<PrismaSupplier> {
    const snap = supplier.toSnapshot();
    return {
      companyName: snap.companyName,
      phone: snap.phone,
      country: snap.country,
      status: snap.status,
      updatedAt: snap.updatedAt,
    };
  }
}
