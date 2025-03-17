-- AlterEnum
ALTER TYPE "feed_content_type" ADD VALUE 'TWEET';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "tweet_id" TEXT;

-- AlterTable
ALTER TABLE "feeds" ADD COLUMN     "tweet_id" TEXT;

-- CreateTable
CREATE TABLE "tweets" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "user_id" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tweets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tweets_user_id_idx" ON "tweets"("user_id");

-- CreateIndex
CREATE INDEX "tweets_created_at_idx" ON "tweets"("created_at");

-- CreateIndex
CREATE INDEX "tweets_is_archived_idx" ON "tweets"("is_archived");

-- CreateIndex
CREATE INDEX "feeds_content_type_tweet_id_idx" ON "feeds"("content_type", "tweet_id");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_tweet_id_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_tweet_fkey" FOREIGN KEY ("tweet_id") REFERENCES "tweets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
