-- CreateTable
CREATE TABLE "tasks" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "point" INTEGER,
    "data" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "tasks_name_key" ON "tasks"("name");
