-- CreateEnum
CREATE TYPE "AdPosition" AS ENUM ('PUB_ASIDE', 'ADS_ASIDE');

-- CreateEnum
CREATE TYPE "AdSlotStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSlot" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "position" "AdPosition" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "tooltip" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" "AdSlotStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "orderRef" TEXT,
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AdSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Advertiser_email_idx" ON "Advertiser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdSlot_orderRef_key" ON "AdSlot"("orderRef");

-- CreateIndex
CREATE INDEX "AdSlot_status_endDate_idx" ON "AdSlot"("status", "endDate");

-- CreateIndex
CREATE INDEX "AdSlot_advertiserId_createdAt_idx" ON "AdSlot"("advertiserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdSlot" ADD CONSTRAINT "AdSlot_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
