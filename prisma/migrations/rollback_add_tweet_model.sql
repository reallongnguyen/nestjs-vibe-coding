-- Rollback migration for add_tweet_model

-- Remove foreign keys first
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_tweet_id_fkey";
ALTER TABLE "feeds" DROP CONSTRAINT IF EXISTS "feeds_tweet_fkey";

-- Drop column in comments table
ALTER TABLE "comments" DROP COLUMN IF EXISTS "tweet_id";

-- Drop column in feeds table
ALTER TABLE "feeds" DROP COLUMN IF EXISTS "tweet_id";
DROP INDEX IF EXISTS "feeds_content_type_tweet_id_idx";

-- Drop the tweets table
DROP TABLE IF EXISTS "tweets";

-- Remove TWEET from FeedContentType enum
-- PostgreSQL doesn't allow removing enum values directly, so we need to create a new enum type
-- and replace the old one.

-- Create a new enum type without TWEET
CREATE TYPE "feed_content_type_new" AS ENUM ('POST', 'USER_EMOTION');

-- Update the fields using the enum
ALTER TABLE "feeds" 
  ALTER COLUMN "content_type" TYPE "feed_content_type_new" 
  USING ("content_type"::text::"feed_content_type_new");

-- Drop the old enum type
DROP TYPE "feed_content_type";

-- Rename the new enum type to the original name
ALTER TYPE "feed_content_type_new" RENAME TO "feed_content_type"; 