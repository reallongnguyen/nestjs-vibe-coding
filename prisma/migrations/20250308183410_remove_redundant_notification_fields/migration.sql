/*
  Warnings:

  - You are about to drop the column `group_count` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `group_key` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `last_event_id` on the `notifications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "notifications_group_key_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "group_count",
DROP COLUMN "group_key",
DROP COLUMN "last_event_id";
