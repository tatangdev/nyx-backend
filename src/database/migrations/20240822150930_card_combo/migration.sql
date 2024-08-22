-- CreateTable
CREATE TABLE "card_combos" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "combo" TEXT NOT NULL,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "card_combos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "card_combos_date_key" ON "card_combos"("date");
