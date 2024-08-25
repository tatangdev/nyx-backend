/*
  Warnings:

  - You are about to drop the column `available_days` on the `cards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cards" DROP COLUMN "available_days",
ADD COLUMN     "available_duration" INTEGER;
