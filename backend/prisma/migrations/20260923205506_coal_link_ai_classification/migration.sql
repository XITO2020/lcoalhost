-- AlterEnum
ALTER TYPE "CoalKind" ADD VALUE 'LINK';

-- AlterTable
ALTER TABLE "CoalSubmission" ADD COLUMN     "aiKind" TEXT,
ADD COLUMN     "aiLang" TEXT,
ADD COLUMN     "aiMeta" JSONB;
