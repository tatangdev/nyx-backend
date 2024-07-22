-- CreateTable
CREATE TABLE "card_levels" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "card_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "point_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "point_histories_pkey" PRIMARY KEY ("id")
);
