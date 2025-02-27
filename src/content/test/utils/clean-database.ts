import { PrismaService } from 'src/common/prisma/prisma.service';

/**
 * Clean the database for testing
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  // Use a transaction to ensure all operations succeed or fail together
  await prisma.$transaction([
    prisma.like.deleteMany(),
    prisma.view.deleteMany(),
    prisma.engageable.deleteMany(),
    prisma.publishedPost.deleteMany(),
    prisma.draftPost.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
