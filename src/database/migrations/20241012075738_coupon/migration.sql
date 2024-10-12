-- AlterTable
ALTER TABLE "player_earnings" ADD COLUMN     "coupons_balance" INTEGER;

-- CreateTable
CREATE TABLE "coupon_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT,
    "created_at_unix" INTEGER,

    CONSTRAINT "coupon_histories_pkey" PRIMARY KEY ("id")
);
