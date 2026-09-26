-- CreateTable
CREATE TABLE "PromoStat" (
    "key" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PromoStat_pkey" PRIMARY KEY ("key","day")
);
