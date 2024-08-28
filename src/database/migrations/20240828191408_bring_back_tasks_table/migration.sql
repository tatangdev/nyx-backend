-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "type" TEXT,
    "reward_coins" INTEGER,
    "config" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "requires_admin_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);
