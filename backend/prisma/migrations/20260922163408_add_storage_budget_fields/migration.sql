-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Item_storage_pinned_mirroredAt_idx" ON "Item"("storage", "pinned", "mirroredAt");
