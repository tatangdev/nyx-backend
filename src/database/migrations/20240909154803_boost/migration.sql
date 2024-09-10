-- AlterTable
ALTER TABLE "player_earnings" ADD COLUMN     "recharge_earning_energy" INTEGER DEFAULT 6,
ADD COLUMN     "tap_earning_energy_level" INTEGER DEFAULT 1,
ADD COLUMN     "tap_earning_level" INTEGER DEFAULT 1;
