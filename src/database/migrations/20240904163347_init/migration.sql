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
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "referee_id" INTEGER,
    "referral_code" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_earnings" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "player_level" INTEGER DEFAULT 1,
    "passive_per_hour" INTEGER NOT NULL,
    "coins_total" INTEGER NOT NULL,
    "coins_balance" INTEGER NOT NULL,
    "coins_spent" INTEGER,
    "tap_earning_value" INTEGER,
    "tap_earning_energy" INTEGER,
    "tap_earning_energy_recovery" INTEGER,
    "tap_earning_energy_available" INTEGER,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "player_earnings_pkey" PRIMARY KEY ("id")
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
    "description" TEXT,
    "image" TEXT,
    "category_id" INTEGER NOT NULL,
    "levels" TEXT,
    "condition" TEXT,
    "available_duration" INTEGER,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at_unix" INTEGER,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_combos" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "combination" TEXT,
    "reward_coins" INTEGER NOT NULL,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "card_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_submissions" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "player_id" INTEGER NOT NULL,
    "combination" TEXT,
    "correct_combo" INTEGER NOT NULL,
    "created_at_unix" INTEGER,

    CONSTRAINT "combo_submissions_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "passive_earning_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_histories" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "data" TEXT,
    "created_at_unix" INTEGER,

    CONSTRAINT "level_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "type" TEXT,
    "reward_coins" INTEGER,
    "config" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "requires_admin_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_submissions" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "image" TEXT,
    "is_approved" BOOLEAN,
    "approval_by" INTEGER,
    "submitted_at_unix" INTEGER NOT NULL,
    "completed_at_unix" INTEGER,

    CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "days" INTEGER DEFAULT 1,
    "last_attendance" INTEGER,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "players_telegram_id_key" ON "players"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_referral_code_key" ON "players"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "player_earnings_player_id_key" ON "player_earnings"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_combos_date_key" ON "card_combos"("date");
