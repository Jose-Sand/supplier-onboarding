import { IChecklistRepository } from '../../domain/ports/IChecklistRepository';
import { ChecklistProps } from '../../domain/entities/Checklist';

export interface GetChecklistsBySupplierIdOutput {
  checklists: ChecklistProps[];
}

export class GetChecklistsBySupplierId {
  constructor(private readonly checklistRepository: IChecklistRepository) {}

  async execute(supplierId: string): Promise<GetChecklistsBySupplierIdOutput> {
    const checklists = await this.checklistRepository.findBySupplierId(supplierId);
    return { checklists: checklists.map((c) => c.toSnapshot()) };
  }
}
