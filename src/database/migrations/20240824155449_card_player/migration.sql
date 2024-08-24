-- CreateTable
CREATE TABLE "card_players" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "history" TEXT,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "card_players_pkey" PRIMARY KEY ("id")
);
