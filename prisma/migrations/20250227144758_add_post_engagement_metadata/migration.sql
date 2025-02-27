-- AlterTable
ALTER TABLE "published_posts" ADD COLUMN     "lastEngagementAt" TIMESTAMP(3),
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';
