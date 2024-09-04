/*
  Warnings:

  - You are about to drop the column `updated_at_unix` on the `point_histories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "point_histories" DROP COLUMN "updated_at_unix";
