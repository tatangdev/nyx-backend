/*
  Warnings:

  - You are about to drop the column `description` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `icon_url` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `tasks` table. All the data in the column will be lost.
  - Made the column `point` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "last_attendance" INTEGER;

-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "description",
DROP COLUMN "icon_url",
DROP COLUMN "is_active",
ADD COLUMN     "config" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "periodicity" TEXT NOT NULL DEFAULT 'Once',
ADD COLUMN     "reward_coins" INTEGER,
ALTER COLUMN "point" SET NOT NULL,
ALTER COLUMN "point" SET DEFAULT 0,
ALTER COLUMN "type" SET DEFAULT 'Default';

-- CreateTable
CREATE TABLE "task_completions" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "task_id" TEXT NOT NULL,
    "completed_at_unix" INTEGER NOT NULL,

    CONSTRAINT "task_completions_pkey" PRIMARY KEY ("id")
);
