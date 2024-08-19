/*
  Warnings:

  - You are about to drop the column `is_publish` on the `cards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cards" DROP COLUMN "is_publish",
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false;
