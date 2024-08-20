-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "day_count" INTEGER NOT NULL DEFAULT 1,
    "last_attend" INTEGER NOT NULL DEFAULT 0,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);
