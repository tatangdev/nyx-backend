/*
  Warnings:

  - A unique constraint covering the columns `[referral_code]` on the table `players` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "referral_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "players_referral_code_key" ON "players"("referral_code");
