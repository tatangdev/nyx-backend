/*
  Warnings:

  - Changed the type of `task_id` on the `task_completions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "task_completions" DROP COLUMN "task_id",
ADD COLUMN     "task_id" INTEGER NOT NULL;
