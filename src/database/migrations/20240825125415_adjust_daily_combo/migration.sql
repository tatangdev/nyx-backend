/*
  Warnings:

  - You are about to drop the column `first_card_id` on the `card_combos` table. All the data in the column will be lost.
  - You are about to drop the column `one_combo_reward` on the `card_combos` table. All the data in the column will be lost.
  - You are about to drop the column `second_card_id` on the `card_combos` table. All the data in the column will be lost.
  - You are about to drop the column `third_card_id` on the `card_combos` table. All the data in the column will be lost.
  - You are about to drop the column `three_combo_reward` on the `card_combos` table. All the data in the column will be lost.
  - You are about to drop the column `two_combo_reward` on the `card_combos` table. All the data in the column will be lost.
  - You are about to drop the column `first_card_id` on the `combo_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `second_card_id` on the `combo_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `third_card_id` on the `combo_submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "card_combos" DROP COLUMN "first_card_id",
DROP COLUMN "one_combo_reward",
DROP COLUMN "second_card_id",
DROP COLUMN "third_card_id",
DROP COLUMN "three_combo_reward",
DROP COLUMN "two_combo_reward",
ADD COLUMN     "combination" TEXT;

-- AlterTable
ALTER TABLE "combo_submissions" DROP COLUMN "first_card_id",
DROP COLUMN "second_card_id",
DROP COLUMN "third_card_id",
ADD COLUMN     "combination" TEXT;
