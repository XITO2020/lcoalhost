-- CreateEnum
CREATE TYPE "CoalKind" AS ENUM ('TIKTOK', 'ARTICLE', 'IMAGE');

-- CreateEnum
CREATE TYPE "CoalStatus" AS ENUM ('PENDING_AI', 'REJECTED_AI', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CoalSubmission" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "tcEmail" TEXT,
    "kind" "CoalKind" NOT NULL,
    "url" TEXT,
    "imagePath" TEXT,
    "description" TEXT NOT NULL,
    "status" "CoalStatus" NOT NULL DEFAULT 'PENDING_AI',
    "aiTopic" TEXT,
    "aiReason" TEXT,
    "resultItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "CoalSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoalSubmission_visitorId_createdAt_idx" ON "CoalSubmission"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "CoalSubmission_status_createdAt_idx" ON "CoalSubmission"("status", "createdAt");
