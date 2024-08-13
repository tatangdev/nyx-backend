-- CreateTable
CREATE TABLE "player_earnings" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "passive_per_hour" INTEGER NOT NULL,
    "tap_max" INTEGER NOT NULL,
    "tap_points" INTEGER NOT NULL,
    "tap_available" INTEGER NOT NULL,
    "coins_total" INTEGER NOT NULL,
    "coins_balance" INTEGER NOT NULL,
    "last_updated" INTEGER NOT NULL,

    CONSTRAINT "player_earnings_pkey" PRIMARY KEY ("id")
);
