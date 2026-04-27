-- AlterTable
ALTER TABLE "checklists" ADD COLUMN     "supplier_id" TEXT;

-- CreateIndex
CREATE INDEX "checklists_supplier_id_idx" ON "checklists"("supplier_id");
