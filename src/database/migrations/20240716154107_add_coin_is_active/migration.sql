-- AlterTable
ALTER TABLE "coin_categories" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "coins" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
