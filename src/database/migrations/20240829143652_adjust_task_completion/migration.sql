/*
  Warnings:

  - You are about to drop the `task_completions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "task_completions";

-- CreateTable
CREATE TABLE "task_submissions" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "image" TEXT,
    "submitted_at_unix" INTEGER NOT NULL,
    "completed_at_unix" INTEGER,
    "is_approved" BOOLEAN,
    "approval_by" INTEGER,

    CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id")
);
