/*
  Warnings:

  - The values [owner,admin,member] on the enum `space_member_role` will be removed. If these variants are still used in the database, this will fail.
  - The values [user,admin,root] on the enum `user_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'ROLE_CHANGE', 'ACCOUNT_DEACTIVATED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_DELETED');

-- AlterEnum
BEGIN;
CREATE TYPE "space_member_role_new" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
ALTER TABLE "user_in_spaces" ALTER COLUMN "role" TYPE "space_member_role_new" USING ("role"::text::"space_member_role_new");
ALTER TYPE "space_member_role" RENAME TO "space_member_role_old";
ALTER TYPE "space_member_role_new" RENAME TO "space_member_role";
DROP TYPE "space_member_role_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "user_role_new" AS ENUM ('USER', 'ADMIN', 'ROOT');
ALTER TABLE "users" ALTER COLUMN "roles" TYPE "user_role_new"[] USING ("roles"::text::"user_role_new"[]);
ALTER TYPE "user_role" RENAME TO "user_role_old";
ALTER TYPE "user_role_new" RENAME TO "user_role";
DROP TYPE "user_role_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "UserActivityType" NOT NULL,
    "performed_by" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activities_user_id_idx" ON "user_activities"("user_id");

-- CreateIndex
CREATE INDEX "user_activities_timestamp_idx" ON "user_activities"("timestamp");

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
