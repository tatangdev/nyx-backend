/*
  Warnings:

  - Made the column `coupons_balance` on table `player_earnings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "player_earnings" ALTER COLUMN "coupons_balance" SET NOT NULL,
ALTER COLUMN "coupons_balance" SET DEFAULT 0;
