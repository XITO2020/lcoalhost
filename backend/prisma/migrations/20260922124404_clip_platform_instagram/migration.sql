-- CreateEnum
CREATE TYPE "ClipPlatform" AS ENUM ('TIKTOK', 'INSTAGRAM');

-- AlterTable
ALTER TABLE "TiktokClip" ADD COLUMN     "platform" "ClipPlatform" NOT NULL DEFAULT 'TIKTOK',
ADD COLUMN     "note" TEXT;

-- DropIndex
DROP INDEX "TiktokClip_videoId_key";

-- CreateIndex
CREATE UNIQUE INDEX "TiktokClip_platform_videoId_key" ON "TiktokClip"("platform", "videoId");
