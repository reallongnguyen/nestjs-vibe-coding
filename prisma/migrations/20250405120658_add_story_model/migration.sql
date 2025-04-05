-- AlterEnum
ALTER TYPE "feed_content_type" ADD VALUE 'STORY';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "story_id" TEXT;

-- AlterTable
ALTER TABLE "feeds" ADD COLUMN     "story_id" TEXT;

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "root_id" TEXT,
    "chain_position" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stories_user_id_idx" ON "stories"("user_id");

-- CreateIndex
CREATE INDEX "stories_parent_id_idx" ON "stories"("parent_id");

-- CreateIndex
CREATE INDEX "stories_root_id_idx" ON "stories"("root_id");

-- CreateIndex
CREATE INDEX "stories_chain_position_idx" ON "stories"("chain_position");

-- CreateIndex
CREATE INDEX "stories_created_at_idx" ON "stories"("created_at");

-- CreateIndex
CREATE INDEX "stories_is_archived_idx" ON "stories"("is_archived");

-- CreateIndex
CREATE INDEX "stories_version_idx" ON "stories"("version");

-- CreateIndex
CREATE INDEX "stories_user_id_created_at_idx" ON "stories"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_tweet_id_idx" ON "comments"("tweet_id");

-- CreateIndex
CREATE INDEX "comments_story_id_idx" ON "comments"("story_id");

-- CreateIndex
CREATE INDEX "feeds_content_type_story_id_idx" ON "feeds"("content_type", "story_id");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_story_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_root_id_fkey" FOREIGN KEY ("root_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
