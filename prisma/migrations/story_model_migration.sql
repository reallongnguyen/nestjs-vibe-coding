-- Create Story model
CREATE TABLE "stories" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "images" TEXT[],
  "user_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "root_id" TEXT,
  "chain_position" INTEGER NOT NULL DEFAULT 0,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,

  CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stories" ADD CONSTRAINT "stories_parent_id_fkey" 
  FOREIGN KEY ("parent_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stories" ADD CONSTRAINT "stories_root_id_fkey" 
  FOREIGN KEY ("root_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for performance
CREATE INDEX "stories_user_id_idx" ON "stories"("user_id");
CREATE INDEX "stories_parent_id_idx" ON "stories"("parent_id");
CREATE INDEX "stories_root_id_idx" ON "stories"("root_id");
CREATE INDEX "stories_chain_position_idx" ON "stories"("chain_position");
CREATE INDEX "stories_created_at_idx" ON "stories"("created_at");
CREATE INDEX "stories_is_archived_idx" ON "stories"("is_archived");
CREATE INDEX "stories_version_idx" ON "stories"("version");
CREATE INDEX "stories_user_id_created_at_idx" ON "stories"("user_id", "created_at" DESC);

-- Update Feed model to include story content type
ALTER TYPE "feed_content_type" ADD VALUE 'STORY' IF NOT EXISTS;
ALTER TABLE "feeds" ADD COLUMN IF NOT EXISTS "story_id" TEXT;
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_story_fkey" 
  FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "feeds_content_type_story_id_idx" ON "feeds"("content_type", "story_id");

-- Update Comment model to support stories
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "story_id" TEXT;
ALTER TABLE "comments" ADD CONSTRAINT "comments_story_id_fkey" 
  FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "comments_story_id_idx" ON "comments"("story_id"); 