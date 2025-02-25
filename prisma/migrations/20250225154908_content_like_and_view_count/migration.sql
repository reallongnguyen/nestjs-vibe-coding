/*
  Warnings:

  - The primary key for the `post_likes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[post_id,user_id]` on the table `post_likes` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `post_likes` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "PostView" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "viewer_id" TEXT,
    "viewer_hash" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostView_post_id_idx" ON "PostView"("post_id");

-- CreateIndex
CREATE INDEX "PostView_viewer_hash_idx" ON "PostView"("viewer_hash");

-- CreateIndex
CREATE INDEX "PostView_timestamp_idx" ON "PostView"("timestamp");

-- CreateIndex
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");

-- CreateIndex
CREATE INDEX "post_likes_user_id_idx" ON "post_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "published_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
