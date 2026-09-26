-- CreateEnum
CREATE TYPE "ItemKind" AS ENUM ('MEME', 'VIDEO', 'ARTICLE');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "StorageMode" AS ENUM ('LINK', 'MIRROR');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('UNKNOWN', 'OK', 'DEAD');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LOL', 'JERRY', 'UTILE', 'ALERTE');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "kind" "ItemKind" NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "permalink" TEXT NOT NULL,
    "discussionUrl" TEXT,
    "mediaUrl" TEXT,
    "embedUrl" TEXT,
    "thumbUrl" TEXT,
    "author" TEXT,
    "topic" TEXT NOT NULL DEFAULT 'general',
    "score" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "license" TEXT,
    "reusable" BOOLEAN NOT NULL DEFAULT false,
    "storage" "StorageMode" NOT NULL DEFAULT 'LINK',
    "localPath" TEXT,
    "mirroredAt" TIMESTAMP(3),
    "linkStatus" "LinkStatus" NOT NULL DEFAULT 'UNKNOWN',
    "linkCheckedAt" TIMESTAMP(3),
    "status" "ItemStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'Mon classeur',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ScrapeRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "report" JSONB,

    CONSTRAINT "ScrapeRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Item_kind_status_publishedAt_idx" ON "Item"("kind", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Item_kind_status_reactionCount_idx" ON "Item"("kind", "status", "reactionCount");

-- CreateIndex
CREATE INDEX "Item_topic_idx" ON "Item"("topic");

-- CreateIndex
CREATE INDEX "Item_storage_reusable_idx" ON "Item"("storage", "reusable");

-- CreateIndex
CREATE UNIQUE INDEX "Item_source_sourceId_key" ON "Item"("source", "sourceId");

-- CreateIndex
CREATE INDEX "Reaction_visitorId_idx" ON "Reaction"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_itemId_visitorId_type_key" ON "Reaction"("itemId", "visitorId", "type");

-- CreateIndex
CREATE INDEX "Shelf_visitorId_folder_idx" ON "Shelf"("visitorId", "folder");

-- CreateIndex
CREATE UNIQUE INDEX "Shelf_itemId_visitorId_key" ON "Shelf"("itemId", "visitorId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelf" ADD CONSTRAINT "Shelf_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
