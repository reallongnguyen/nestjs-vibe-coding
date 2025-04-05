-- Drop indexes first
DROP INDEX IF EXISTS "tweets_version_idx";
DROP INDEX IF EXISTS "tweets_user_id_created_at_idx";

-- Drop version column
ALTER TABLE "tweets" DROP COLUMN IF EXISTS "version"; 