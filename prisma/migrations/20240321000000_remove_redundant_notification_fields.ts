import { Prisma } from 'src/generated/client';

export default {
  async up(prisma: Prisma.TransactionClient): Promise<void> {
    // Drop indexes first
    await prisma.$executeRaw`DROP INDEX IF EXISTS "notifications_group_key_idx"`;

    // Remove columns
    await prisma.$executeRaw`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "group_key"`;
    await prisma.$executeRaw`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "group_count"`;
    await prisma.$executeRaw`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "last_event_id"`;
  },

  async down(prisma: Prisma.TransactionClient): Promise<void> {
    // Add columns back
    await prisma.$executeRaw`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "group_key" TEXT`;
    await prisma.$executeRaw`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "group_count" INTEGER NOT NULL DEFAULT 1`;
    await prisma.$executeRaw`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "last_event_id" TEXT`;

    // Recreate index
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "notifications_group_key_idx" ON "notifications"("group_key")`;
  },
};
