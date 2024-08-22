/*
  Warnings:

  - You are about to drop the column `fisrt_card_id` on the `card_combos` table. All the data in the column will be lost.
  - Added the required column `first_card_id` to the `card_combos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "card_combos" DROP COLUMN "fisrt_card_id",
ADD COLUMN     "first_card_id" INTEGER NOT NULL;
