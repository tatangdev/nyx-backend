/*
  Warnings:

  - You are about to drop the column `tap_available` on the `player_earnings` table. All the data in the column will be lost.
  - You are about to drop the column `tap_max` on the `player_earnings` table. All the data in the column will be lost.
  - You are about to drop the column `tap_points` on the `player_earnings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "player_earnings" DROP COLUMN "tap_available",
DROP COLUMN "tap_max",
DROP COLUMN "tap_points";
