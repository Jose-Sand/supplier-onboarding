import { Checklist } from '../entities/Checklist';

export interface IChecklistRepository {
  save(checklist: Checklist): Promise<void>;
  findById(id: string): Promise<Checklist | null>;
  findBySupplierId(supplierId: string): Promise<Checklist[]>;
  findAll(): Promise<Checklist[]>;
  delete(id: string): Promise<void>;
}
