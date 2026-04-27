import { Checklist } from '../../../domain/entities/Checklist';

type PrismaTask = {
  id: string;
  checklistId: string;
  title: string;
  description: string | null;
  required: boolean;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
};

type PrismaChecklist = {
  id: string;
  supplierId: string;      // required in schema — never null
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: PrismaTask[];
};

export class ChecklistPrismaMapper {
  static toDomain(raw: PrismaChecklist): Checklist {
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

  static toPrismaCreate(checklist: Checklist) {
    const snap = checklist.toSnapshot();
    return {
      id: snap.id,
      // supplierId is required in schema; the domain marks it optional only for tests
      supplierId: snap.supplierId!,
      title: snap.title,
      description: snap.description ?? null,
      status: snap.status,
      createdAt: snap.createdAt,
      updatedAt: snap.updatedAt,
      tasks: {
        create: snap.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description ?? null,
          completed: t.completed,
          completedAt: t.completedAt ?? null,
          createdAt: t.createdAt,
        })),
      },
    };
  }

  static toPrismaUpdate(checklist: Checklist) {
    const snap = checklist.toSnapshot();
    return {
      title: snap.title,
      description: snap.description ?? null,
      status: snap.status,
      // updatedAt is managed by @updatedAt — no need to supply it
      tasks: {
        upsert: snap.tasks.map((t) => ({
          where: { id: t.id },
          create: {
            id: t.id,
            title: t.title,
            description: t.description ?? null,
            completed: t.completed,
            completedAt: t.completedAt ?? null,
            createdAt: t.createdAt,
          },
          update: {
            completed: t.completed,
            completedAt: t.completedAt ?? null,
          },
        })),
      },
    };
  }
}
