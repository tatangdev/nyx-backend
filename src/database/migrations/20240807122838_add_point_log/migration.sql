-- CreateTable
CREATE TABLE "point_logs" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "unix_time" INTEGER NOT NULL,

    CONSTRAINT "point_logs_pkey" PRIMARY KEY ("id")
);
