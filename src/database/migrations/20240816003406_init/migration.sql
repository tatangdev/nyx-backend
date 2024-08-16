-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_superadmin" BOOLEAN NOT NULL DEFAULT false,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "telegram_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "referee_id" INTEGER,
    "referral_code" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "card_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "levels" TEXT,
    "requirements" TEXT,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_levels" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "card_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "point_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passive_earning_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "passive_earning_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "data" TEXT,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "level_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configs" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_earnings" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "passive_per_hour" INTEGER NOT NULL,
    "tap_max" INTEGER NOT NULL,
    "tap_points" INTEGER NOT NULL,
    "tap_available" INTEGER NOT NULL,
    "coins_total" INTEGER NOT NULL,
    "coins_balance" INTEGER NOT NULL,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "player_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "players_telegram_id_key" ON "players"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_referral_code_key" ON "players"("referral_code");
