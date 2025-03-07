-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('LIKE_CREATED', 'LIKE_DELETED', 'COMMENT_CREATED', 'COMMENT_REPLIED', 'FOLLOW_CREATED', 'FOLLOW_DELETED');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "group_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "group_key" TEXT,
ADD COLUMN     "last_event_id" TEXT;

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "type" "event_type" NOT NULL,
    "version" TEXT NOT NULL,
    "producer" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_processed_at_idx" ON "events"("processed_at");

-- CreateIndex
CREATE INDEX "notifications_group_key_idx" ON "notifications"("group_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_type_created_at_idx" ON "notifications"("user_id", "type", "created_at");
