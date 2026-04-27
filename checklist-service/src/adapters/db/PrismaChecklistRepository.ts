import { PrismaClient } from '../../generated/prisma/client';
import { Checklist } from '../../domain/entities/Checklist';
import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';
import { ChecklistPrismaMapper } from './mappers/ChecklistPrismaMapper';

const INCLUDE_TASKS = { tasks: true } as const;

function toChecklist(raw: {
  id: string;
  supplierId: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: Array<{
    id: string;
    checklistId: string;
    title: string;
    description: string | null;
    required: boolean;
    completed: boolean;
    completedAt: Date | null;
    createdAt: Date;
  }>;
}): Checklist {
  return Checklist.reconstitute({
    id: raw.id,
    supplierId: raw.supplierId,
    title: raw.title,
    description: raw.description ?? undefined,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    tasks: raw.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      completed: t.completed,
      completedAt: t.completedAt ?? undefined,
      createdAt: t.createdAt,
    })),
  });
}

export class PrismaChecklistRepository implements IChecklistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(checklist: Checklist): Promise<void> {
    const exists = await this.prisma.checklist.findUnique({
      where: { id: checklist.id },
      select: { id: true },
    });

    if (!exists) {
      await this.prisma.checklist.create({
        data: {
          id: checklist.id,
          supplierId: checklist.supplierId ?? '',
          title: checklist.title,
          description: checklist.description ?? null,
          status: checklist.status.toString(),
          createdAt: checklist.createdAt,
          updatedAt: checklist.updatedAt,
          tasks: {
            create: checklist.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description ?? null,
              required: true,
              completed: t.completed,
              completedAt: t.completedAt ?? null,
              createdAt: t.createdAt,
            })),
          },
        },
      });
    } else {
      await this.prisma.checklist.update({
        where: { id: checklist.id },
        data: ChecklistPrismaMapper.toPrismaUpdate(checklist),
      });
    }
  }

  async findById(id: string): Promise<Checklist | null> {
    const raw = await this.prisma.checklist.findUnique({
      where: { id },
      include: INCLUDE_TASKS,
    });
    if (!raw) return null;
    return toChecklist(raw);
  }

  async findBySupplierId(supplierId: string): Promise<Checklist[]> {
    const rows = await this.prisma.checklist.findMany({
      where: { supplierId },
      include: INCLUDE_TASKS,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toChecklist);
  }

  async findAll(): Promise<Checklist[]> {
    const rows = await this.prisma.checklist.findMany({
      include: INCLUDE_TASKS,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toChecklist);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.checklist.delete({ where: { id } });
  }
}
