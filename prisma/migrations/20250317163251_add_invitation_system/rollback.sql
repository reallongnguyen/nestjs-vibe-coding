-- Drop foreign keys first
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_accepted_by_fkey";
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_inviter_id_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "invitations_code_idx";
DROP INDEX IF EXISTS "invitations_inviter_id_idx";
DROP INDEX IF EXISTS "invitations_code_key";

-- Drop table
DROP TABLE IF EXISTS "invitations";

-- Drop enum
DROP TYPE IF EXISTS "invitation_status"; 