-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "lang" TEXT NOT NULL DEFAULT 'en';

-- CreateIndex
CREATE INDEX "Item_kind_lang_status_idx" ON "Item"("kind", "lang", "status");
