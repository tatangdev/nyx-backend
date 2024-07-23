-- CreateTable
CREATE TABLE "configs" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("id")
);
