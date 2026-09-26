-- CreateEnum
CREATE TYPE "LiquidArea" AS ENUM ('METRICS', 'VIDEOS', 'ARTICLES_MEMES');

-- CreateEnum
CREATE TYPE "LiquidStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "LiquidSubmission" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "area" "LiquidArea" NOT NULL,
    "rawInput" TEXT NOT NULL,
    "enhanced" TEXT NOT NULL,
    "status" "LiquidStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "LiquidSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiquidSubmission_visitorId_createdAt_idx" ON "LiquidSubmission"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "LiquidSubmission_status_createdAt_idx" ON "LiquidSubmission"("status", "createdAt");
