/*
  Warnings:

  - Added the required column `reward_coins` to the `card_combos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "card_combos" ADD COLUMN     "reward_coins" INTEGER NOT NULL;
