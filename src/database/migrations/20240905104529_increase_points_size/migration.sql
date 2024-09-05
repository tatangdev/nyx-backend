-- AlterTable
ALTER TABLE "passive_earning_histories" ALTER COLUMN "amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "player_earnings" ALTER COLUMN "passive_per_hour" SET DATA TYPE BIGINT,
ALTER COLUMN "coins_total" SET DATA TYPE BIGINT,
ALTER COLUMN "coins_balance" SET DATA TYPE BIGINT,
ALTER COLUMN "coins_spent" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "point_histories" ALTER COLUMN "amount" SET DATA TYPE BIGINT;
