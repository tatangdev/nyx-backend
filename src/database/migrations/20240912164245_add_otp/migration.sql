-- AlterTable
ALTER TABLE "players" ADD COLUMN     "phone_number" TEXT;

-- CreateTable
CREATE TABLE "otps" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "otp" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "agent" TEXT,
    "expired_at_unix" INTEGER,
    "created_at_unix" INTEGER,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);
