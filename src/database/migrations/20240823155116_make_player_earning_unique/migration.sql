/*
  Warnings:

  - A unique constraint covering the columns `[player_id]` on the table `player_earnings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "player_earnings_player_id_key" ON "player_earnings"("player_id");
