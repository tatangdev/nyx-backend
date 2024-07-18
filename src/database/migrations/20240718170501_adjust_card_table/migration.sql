/*
  Warnings:

  - You are about to drop the `card_levels` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "levels" TEXT,
ADD COLUMN     "requirements" TEXT;

-- DropTable
DROP TABLE "card_levels";
