/*
  Warnings:

  - The primary key for the `draft_posts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `draft_posts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "draft_posts" DROP CONSTRAINT "draft_posts_user_id_fkey";

-- DropIndex
DROP INDEX "draft_posts_published_id_key";

-- AlterTable
ALTER TABLE "draft_posts" DROP CONSTRAINT "draft_posts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "draft_posts_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "draft_posts_published_id_idx" ON "draft_posts"("published_id");

-- CreateIndex
CREATE INDEX "draft_posts_topics_idx" ON "draft_posts" USING GIN ("topics");

-- CreateIndex
CREATE INDEX "draft_posts_created_at_idx" ON "draft_posts"("created_at");

-- AddForeignKey
ALTER TABLE "draft_posts" ADD CONSTRAINT "draft_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
