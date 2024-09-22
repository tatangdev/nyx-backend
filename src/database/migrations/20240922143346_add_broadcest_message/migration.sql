-- CreateTable
CREATE TABLE "broadcast_messages" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at_unix" INTEGER,

    CONSTRAINT "broadcast_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_message_mappings" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at_unix" INTEGER,
    "updated_at_unix" INTEGER,

    CONSTRAINT "broadcast_message_mappings_pkey" PRIMARY KEY ("id")
);
