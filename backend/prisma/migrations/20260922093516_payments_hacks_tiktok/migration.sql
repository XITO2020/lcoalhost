-- CreateEnum
CREATE TYPE "PaymentRail" AS ENUM ('STRIPE', 'PAYPAL', 'REVOLUT', 'TEZOS', 'HYPERLIQUID', 'MONERO');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('PENDING', 'SEEN', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "HackOrderStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'REFUNDED');

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "rail" "PaymentRail" NOT NULL,
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'PENDING',
    "orderRef" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountEur" DECIMAL(12,2) NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "payCurrency" TEXT,
    "payAmount" DECIMAL(30,0),
    "payDecimals" INTEGER,
    "payToAddress" TEXT,
    "uniqueRef" TEXT,
    "rateEurPerUnit" DECIMAL(18,8),
    "externalId" TEXT,
    "checkoutUrl" TEXT,
    "txRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(30,0),
    "payerRef" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "ecosystemCreditedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "rail" "PaymentRail" NOT NULL,
    "type" TEXT NOT NULL,
    "txRef" TEXT NOT NULL DEFAULT '',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentCursor" (
    "rail" "PaymentRail" NOT NULL,
    "cursor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentCursor_pkey" PRIMARY KEY ("rail")
);

-- CreateTable
CREATE TABLE "Hack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teaser" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceNote" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 444,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackOrder" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "status" "HackOrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "hackId" TEXT NOT NULL,

    CONSTRAINT "HackOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HackUnlock" (
    "id" TEXT NOT NULL,
    "hackId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HackUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiktokClip" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "embedHtml" TEXT NOT NULL,
    "authorHandle" TEXT,
    "caption" TEXT,
    "topic" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ItemStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "TiktokClip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_externalId_key" ON "PaymentIntent"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_txRef_key" ON "PaymentIntent"("txRef");

-- CreateIndex
CREATE INDEX "PaymentIntent_siteId_rail_status_idx" ON "PaymentIntent"("siteId", "rail", "status");

-- CreateIndex
CREATE INDEX "PaymentIntent_rail_status_expiresAt_idx" ON "PaymentIntent"("rail", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_orderRef_idx" ON "PaymentIntent"("orderRef");

-- CreateIndex
CREATE INDEX "PaymentIntent_userId_idx" ON "PaymentIntent"("userId");

-- CreateIndex
CREATE INDEX "PaymentEvent_rail_type_createdAt_idx" ON "PaymentEvent"("rail", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_intentId_txRef_type_key" ON "PaymentEvent"("intentId", "txRef", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Hack_slug_key" ON "Hack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HackOrder_ref_key" ON "HackOrder"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "HackOrder_paymentIntentId_key" ON "HackOrder"("paymentIntentId");

-- CreateIndex
CREATE INDEX "HackOrderItem_orderId_idx" ON "HackOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "HackOrderItem_hackId_idx" ON "HackOrderItem"("hackId");

-- CreateIndex
CREATE INDEX "HackUnlock_visitorId_idx" ON "HackUnlock"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "HackUnlock_hackId_visitorId_key" ON "HackUnlock"("hackId", "visitorId");

-- CreateIndex
CREATE INDEX "TiktokClip_topic_status_addedAt_idx" ON "TiktokClip"("topic", "status", "addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TiktokClip_videoId_key" ON "TiktokClip"("videoId");

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackOrderItem" ADD CONSTRAINT "HackOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "HackOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackOrderItem" ADD CONSTRAINT "HackOrderItem_hackId_fkey" FOREIGN KEY ("hackId") REFERENCES "Hack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackUnlock" ADD CONSTRAINT "HackUnlock_hackId_fkey" FOREIGN KEY ("hackId") REFERENCES "Hack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
