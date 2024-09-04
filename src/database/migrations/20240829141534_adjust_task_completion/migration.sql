/*
  Warnings:

  - You are about to drop the column `updated_at_unix` on the `level_histories` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at_unix` on the `passive_earning_histories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "level_histories" DROP COLUMN "updated_at_unix";

-- AlterTable
ALTER TABLE "passive_earning_histories" DROP COLUMN "updated_at_unix";
