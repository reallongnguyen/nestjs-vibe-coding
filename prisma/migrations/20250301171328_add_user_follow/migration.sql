/*
  Warnings:

  - You are about to drop the column `like_count` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `like_count` on the `published_posts` table. All the data in the column will be lost.
  - You are about to drop the column `reply_count` on the `published_posts` table. All the data in the column will be lost.
  - You are about to drop the column `view_count` on the `published_posts` table. All the data in the column will be lost.
  - You are about to drop the `PostView` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `comment_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_likes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PostView" DROP CONSTRAINT "PostView_post_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_user_id_fkey";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "like_count";

-- AlterTable
ALTER TABLE "published_posts" DROP COLUMN "like_count",
DROP COLUMN "reply_count",
DROP COLUMN "view_count";

-- DropTable
DROP TABLE "PostView";

-- DropTable
DROP TABLE "comment_likes";

-- DropTable
DROP TABLE "post_likes";

-- CreateTable
CREATE TABLE "user_follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_follows_follower_id_idx" ON "user_follows"("follower_id");

-- CreateIndex
CREATE INDEX "user_follows_following_id_idx" ON "user_follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_follower_id_following_id_key" ON "user_follows"("follower_id", "following_id");

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
