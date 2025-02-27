-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_bot_author_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_author_fkey";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "emotion_id" TEXT,
ALTER COLUMN "post_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "comments_emotion_id_idx" ON "comments"("emotion_id");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_emotion_id_fkey" FOREIGN KEY ("emotion_id") REFERENCES "user_emotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
