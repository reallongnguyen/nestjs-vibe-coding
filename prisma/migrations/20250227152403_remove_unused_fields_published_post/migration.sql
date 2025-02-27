/*
  Warnings:

  - You are about to drop the column `lastEngagementAt` on the `published_posts` table. All the data in the column will be lost.
  - You are about to drop the column `lastViewedAt` on the `published_posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "published_posts" DROP COLUMN "lastEngagementAt",
DROP COLUMN "lastViewedAt";
