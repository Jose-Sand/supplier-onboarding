import { PrismaClient } from '../../generated/prisma/client';
import { Supplier } from '../../domain/entities/Supplier';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository';
import { SupplierPrismaMapper } from './mappers/SupplierPrismaMapper';

export class PrismaSupplierRepository implements ISupplierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(supplier: Supplier): Promise<void> {
    const exists = await this.prisma.supplier.findUnique({
      where: { id: supplier.id },
      select: { id: true },
    });

    if (!exists) {
      await this.prisma.supplier.create({
        data: SupplierPrismaMapper.toPrismaCreate(supplier),
      });
    } else {
      await this.prisma.supplier.update({
        where: { id: supplier.id },
        data: SupplierPrismaMapper.toPrismaUpdate(supplier),
      });
    }
  }

  async findById(id: string): Promise<Supplier | null> {
    const raw = await this.prisma.supplier.findUnique({ where: { id } });
    if (!raw) return null;
    return SupplierPrismaMapper.toDomain(raw);
  }

  async findByEmail(email: string): Promise<Supplier | null> {
    const raw = await this.prisma.supplier.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!raw) return null;
    return SupplierPrismaMapper.toDomain(raw);
  }

  async findAll(): Promise<Supplier[]> {
    const rows = await this.prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(SupplierPrismaMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.supplier.delete({ where: { id } });
  }
}
