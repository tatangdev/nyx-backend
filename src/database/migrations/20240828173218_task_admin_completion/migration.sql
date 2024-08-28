/*
  Warnings:

  - The primary key for the `tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `periodicity` on the `tasks` table. All the data in the column will be lost.
  - The `id` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "tasks_id_key";

-- AlterTable
ALTER TABLE "task_completions" ADD COLUMN     "image" TEXT,
ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_pkey",
DROP COLUMN "periodicity",
ADD COLUMN     "requires_admin_approval" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "type" DROP DEFAULT,
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");
