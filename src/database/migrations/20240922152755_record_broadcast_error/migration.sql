-- AlterTable
ALTER TABLE "broadcast_message_mappings" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "is_failed" BOOLEAN NOT NULL DEFAULT false;
