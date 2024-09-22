/*
  Warnings:

  - You are about to drop the column `player_id` on the `broadcast_message_mappings` table. All the data in the column will be lost.
  - Added the required column `telegram_id` to the `broadcast_message_mappings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "broadcast_message_mappings" DROP COLUMN "player_id",
ADD COLUMN     "telegram_id" INTEGER NOT NULL;
