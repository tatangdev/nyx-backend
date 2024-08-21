/*
  Warnings:

  - You are about to drop the column `created_at_unix` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `day_count` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at_unix` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `icon_url` on the `cards` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `point` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "created_at_unix",
DROP COLUMN "day_count",
DROP COLUMN "updated_at_unix";

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "icon_url";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "data",
DROP COLUMN "point";
