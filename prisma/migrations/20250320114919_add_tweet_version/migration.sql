-- AlterTable
ALTER TABLE "tweets" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tweets_version_idx" ON "tweets"("version");

-- CreateIndex
CREATE INDEX "tweets_user_id_created_at_idx" ON "tweets"("user_id", "created_at" DESC);
