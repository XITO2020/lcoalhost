-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "Item_contentHash_idx" ON "Item"("contentHash");
