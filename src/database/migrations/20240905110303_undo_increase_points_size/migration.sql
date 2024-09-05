/*
  Warnings:

  - You are about to alter the column `amount` on the `passive_earning_histories` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `passive_per_hour` on the `player_earnings` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `coins_total` on the `player_earnings` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `coins_balance` on the `player_earnings` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `coins_spent` on the `player_earnings` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `amount` on the `point_histories` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "passive_earning_histories" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "player_earnings" ALTER COLUMN "passive_per_hour" SET DATA TYPE INTEGER,
ALTER COLUMN "coins_total" SET DATA TYPE INTEGER,
ALTER COLUMN "coins_balance" SET DATA TYPE INTEGER,
ALTER COLUMN "coins_spent" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "point_histories" ALTER COLUMN "amount" SET DATA TYPE INTEGER;
