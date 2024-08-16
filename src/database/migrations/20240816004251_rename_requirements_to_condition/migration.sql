/*
  Warnings:

  - You are about to drop the column `requirements` on the `cards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cards" DROP COLUMN "requirements",
ADD COLUMN     "condition" TEXT;
