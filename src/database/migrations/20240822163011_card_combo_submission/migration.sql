-- CreateTable
CREATE TABLE "combo_submissions" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "player_id" INTEGER NOT NULL,
    "first_card_id" INTEGER NOT NULL,
    "second_card_id" INTEGER NOT NULL,
    "third_card_id" INTEGER NOT NULL,
    "correct_combo" INTEGER NOT NULL,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "combo_submissions_pkey" PRIMARY KEY ("id")
);
