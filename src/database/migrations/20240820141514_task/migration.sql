/*
  Warnings:

  - The primary key for the `tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tasks_name_key";

-- AlterTable
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_id_key" ON "tasks"("id");
