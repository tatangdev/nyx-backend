/*
  Warnings:

  - You are about to drop the column `created_at` on the `card_categories` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `card_categories` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `cards` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `cards` table. All the data in the column will be lost.
  - You are about to drop the column `last_updated` on the `player_earnings` table. All the data in the column will be lost.
  - You are about to drop the column `point_id` on the `point_histories` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `point_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "card_categories" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "updated_at_unix" INTEGER;

-- AlterTable
ALTER TABLE "card_levels" ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "updated_at_unix" INTEGER;

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "updated_at_unix" INTEGER;

-- AlterTable
ALTER TABLE "configs" ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "updated_at_unix" INTEGER;

-- AlterTable
ALTER TABLE "player_earnings" DROP COLUMN "last_updated",
ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "updated_at_unix" INTEGER;

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updated_at_unix" INTEGER;

-- AlterTable
ALTER TABLE "point_histories" DROP COLUMN "point_id",
ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "updated_at_unix" INTEGER,
ALTER COLUMN "data" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "created_at_unix" INTEGER,
ADD COLUMN     "updated_at_unix" INTEGER;

-- DropTable
DROP TABLE "point_logs";

-- CreateTable
CREATE TABLE "passive_earning_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "data" TEXT,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "passive_earning_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "data" TEXT,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "level_histories_pkey" PRIMARY KEY ("id")
);
