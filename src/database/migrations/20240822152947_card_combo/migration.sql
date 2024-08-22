/*
  Warnings:

  - You are about to drop the column `combo` on the `card_combos` table. All the data in the column will be lost.
  - Added the required column `fisrt_card_id` to the `card_combos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `one_combo_reward` to the `card_combos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `second_card_id` to the `card_combos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `third_card_id` to the `card_combos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `three_combo_reward` to the `card_combos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `two_combo_reward` to the `card_combos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "card_combos" DROP COLUMN "combo",
ADD COLUMN     "fisrt_card_id" INTEGER NOT NULL,
ADD COLUMN     "one_combo_reward" INTEGER NOT NULL,
ADD COLUMN     "second_card_id" INTEGER NOT NULL,
ADD COLUMN     "third_card_id" INTEGER NOT NULL,
ADD COLUMN     "three_combo_reward" INTEGER NOT NULL,
ADD COLUMN     "two_combo_reward" INTEGER NOT NULL;
