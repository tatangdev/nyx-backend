/*
  Warnings:

  - Added the required column `type` to the `passive_earning_histories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "passive_earning_histories" ADD COLUMN     "type" TEXT NOT NULL;
