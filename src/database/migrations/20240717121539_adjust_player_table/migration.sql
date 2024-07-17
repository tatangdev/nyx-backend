/*
  Warnings:

  - You are about to drop the column `name` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `players` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `players` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `players` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `created_at` on the `players` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "players" DROP COLUMN "name",
DROP COLUMN "updated_at",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" INTEGER NOT NULL;
