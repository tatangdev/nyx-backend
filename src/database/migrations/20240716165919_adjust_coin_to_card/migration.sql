/*
  Warnings:

  - You are about to drop the `coin_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coin_levels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coins` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "coin_categories";

-- DropTable
DROP TABLE "coin_levels";

-- DropTable
DROP TABLE "coins";

-- CreateTable
CREATE TABLE "card_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_levels" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "profit" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_levels_pkey" PRIMARY KEY ("id")
);
