/*
  Warnings:

  - You are about to drop the column `is_completed` on the `task_completions` table. All the data in the column will be lost.
  - Added the required column `submitted_at_unix` to the `task_completions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "task_completions" DROP COLUMN "is_completed",
ADD COLUMN     "approval_by" INTEGER,
ADD COLUMN     "submitted_at_unix" INTEGER NOT NULL;
