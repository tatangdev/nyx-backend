-- AlterTable
ALTER TABLE "task_completions" ALTER COLUMN "is_approved" DROP NOT NULL,
ALTER COLUMN "is_approved" DROP DEFAULT;
